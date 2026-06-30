import os
import cv2
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import albumentations as A
from albumentations.pytorch import ToTensorV2
from typing import Tuple, List, Dict, Any

# =====================================================================
# Phase 1: Occlusion-Robust Segmentation Pipeline (PyTorch)
# =====================================================================

class SyntheticOcclusion(A.ImageOnlyTransform):
    """
    Advanced Custom Albumentations Transform to simulate highly realistic geospatial occlusions:
    - Shadow Projections: Simulates shadow casting based on sun position (azimuth & elevation).
    - Synthetic Clouds: Organic fractal formations with custom edge blurring and opacity.
    - Seasonal Canopy: Dynamic tree canopies modeling different species and seasons (density, color).
    """
    def __init__(
        self, 
        num_occlusions: int = 3, 
        occlusion_type: str = "shadow", 
        sun_azimuth: float = None,       # 0-360 degrees from North
        sun_elevation: float = None,     # 5-85 degrees above horizon
        cloud_opacity_min: float = 0.2,
        cloud_opacity_max: float = 0.85,
        foliage_season: str = "random",  # summer, autumn, winter, spring, random
        tree_type: str = "random",       # deciduous, coniferous, random
        always_apply: bool = False, 
        p: float = 0.5
    ):
        super(SyntheticOcclusion, self).__init__(always_apply, p)
        self.num_occlusions = num_occlusions
        self.occlusion_type = occlusion_type
        self.sun_azimuth = sun_azimuth
        self.sun_elevation = sun_elevation
        self.cloud_opacity_min = cloud_opacity_min
        self.cloud_opacity_max = cloud_opacity_max
        self.foliage_season = foliage_season
        self.tree_type = tree_type

    def _generate_shadow(self, img_shape: Tuple[int, int, int], azimuth: float, elevation: float) -> np.ndarray:
        h, w = img_shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        
        # Build 3-5 random footprint polygons (e.g. representing buildings or tall structures)
        cx = np.random.randint(w // 5, 4 * w // 5)
        cy = np.random.randint(h // 5, 4 * h // 5)
        size = np.random.randint(15, 50)
        
        num_pts = np.random.randint(3, 6)
        angles = sorted([np.random.uniform(0, 2 * np.pi) for _ in range(num_pts)])
        pts = []
        for a in angles:
            px = cx + int(size * np.cos(a))
            py = cy + int(size * np.sin(a))
            pts.append([px, py])
        pts = np.array(pts, dtype=np.int32)
        
        # Convert azimuth to cartesian angle in radians
        theta = np.radians(90.0 - azimuth)
        # Higher elevation -> shorter shadow, lower elevation -> longer shadow
        shadow_len = int(np.random.uniform(25, 70) * (1.0 / np.tan(np.radians(max(5.0, elevation)))))
        
        dx = int(shadow_len * np.cos(theta))
        dy = int(-shadow_len * np.sin(theta)) # y-axis goes down in image grids
        
        projected_pts = pts + np.array([dx, dy])
        all_pts = np.vstack([pts, projected_pts])
        
        # Draw shadow as the convex hull representing extrusion
        hull = cv2.convexHull(all_pts)
        cv2.fillPoly(mask, [hull], 255)
        return mask

    def _generate_cloud(self, img_shape: Tuple[int, int, int], opacity: float) -> np.ndarray:
        h, w = img_shape[:2]
        mask = np.zeros((h, w), dtype=np.float32)
        
        # Generate organic non-circular clouds using 4-6 overlapping offset ellipses
        num_blobs = np.random.randint(4, 7)
        cx = np.random.randint(w // 6, 5 * w // 6)
        cy = np.random.randint(h // 6, 5 * h // 6)
        
        for _ in range(num_blobs):
            bx = cx + np.random.randint(-35, 35)
            by = cy + np.random.randint(-35, 35)
            rx = np.random.randint(25, 65)
            ry = np.random.randint(15, 45)
            angle = np.random.randint(0, 360)
            
            blob_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.ellipse(blob_mask, (bx, by), (rx, ry), angle, 0, 360, 255, -1)
            mask = np.maximum(mask, blob_mask.astype(np.float32) / 255.0)
            
        # Simulate cloud altitude by varying edge blurring kernel (higher cloud = softer edges)
        edge_blur = np.random.randint(15, 65)
        if edge_blur % 2 == 0:
            edge_blur += 1
        
        mask = cv2.GaussianBlur(mask, (edge_blur, edge_blur), 0)
        return np.clip(mask * opacity, 0.0, 1.0)

    def _generate_tree_canopy(self, img_shape: Tuple[int, int, int], season: str, t_type: str) -> Tuple[np.ndarray, np.ndarray]:
        h, w, c = img_shape
        mask = np.zeros((h, w), dtype=np.float32)
        
        if season == "random":
            season = np.random.choice(["summer", "autumn", "winter", "spring"])
        if t_type == "random":
            t_type = np.random.choice(["deciduous", "coniferous"])
            
        if t_type == "coniferous":
            # Evergreen coniferous pine - dense, needle-like dark forest green in all seasons
            canopy_color = np.array([16, 48, 14]) if c == 3 else np.array([40])
            density = np.random.uniform(0.85, 0.95)
            
            # Pointier crown cluster
            cx = np.random.randint(w // 5, 4 * w // 5)
            cy = np.random.randint(h // 5, 4 * w // 5)
            r = np.random.randint(15, 30)
            tree_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.circle(tree_mask, (cx, cy), r, 255, -1)
            # Add star/jagged needle tips
            for _ in range(6):
                ax = cx + np.random.randint(-r, r)
                ay = cy + np.random.randint(-r, r)
                cv2.circle(tree_mask, (ax, ay), r // 3, 255, -1)
            mask = np.maximum(mask, tree_mask.astype(np.float32) / 255.0)
        else:
            # Deciduous broadleaf canopy - depends heavily on seasonal growth phases
            if season == "summer":
                canopy_color = np.array([34, 112, 34]) if c == 3 else np.array([75]) # Dense deep green
                density = np.random.uniform(0.80, 0.90)
            elif season == "autumn":
                # Autumn colorful foliage (ranging from gold yellow to fiery crimson)
                color_opt = [
                    np.array([194, 91, 10]),  # Deep Amber Orange
                    np.array([150, 24, 8]),   # Rust Red
                    np.array([212, 168, 14])  # Warm Golden Yellow
                ]
                canopy_color = np.random.choice(color_opt) if c == 3 else np.array([110])
                density = np.random.uniform(0.45, 0.65) # Defoliated gaps
            elif season == "winter":
                # Winter bare wood structure (greyish brown branch clusters with low foliage cover)
                canopy_color = np.array([84, 69, 53]) if c == 3 else np.array([55])
                density = np.random.uniform(0.12, 0.28) # High transmission / sparse branches
            else: # spring
                canopy_color = np.array([107, 166, 75]) if c == 3 else np.array([90]) # Soft blossom green
                density = np.random.uniform(0.60, 0.75)
                
            cx = np.random.randint(w // 5, 4 * w // 5)
            cy = np.random.randint(h // 5, 4 * w // 5)
            r = np.random.randint(22, 50)
            
            # Fluffy broadleaf cluster using overlapping spheres
            num_blobs = np.random.randint(3, 6)
            for _ in range(num_blobs):
                ccx = cx + np.random.randint(-12, 12)
                ccy = cy + np.random.randint(-12, 12)
                cr = np.random.randint(r // 2, r)
                tree_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.circle(tree_mask, (ccx, ccy), cr, 255, -1)
                mask = np.maximum(mask, tree_mask.astype(np.float32) / 255.0)
                
        # Blur the foliage edges
        blur_size = 9 if t_type == "coniferous" else 15
        mask = cv2.GaussianBlur(mask, (blur_size, blur_size), 0)
        mask = np.clip(mask * density, 0.0, 1.0)
        return mask, canopy_color

    def apply(self, img: np.ndarray, **params) -> np.ndarray:
        h, w, c = img.shape
        img_out = img.copy().astype(np.float32)

        for _ in range(np.random.randint(1, self.num_occlusions + 1)):
            o_type = self.occlusion_type
            if o_type == "random":
                o_type = np.random.choice(["shadow", "cloud", "tree"])

            if o_type == "shadow":
                # Fetch or randomize sun position
                azimuth = self.sun_azimuth if self.sun_azimuth is not None else np.random.uniform(0.0, 360.0)
                elevation = self.sun_elevation if self.sun_elevation is not None else np.random.uniform(15.0, 75.0)
                
                mask = self._generate_shadow(img.shape, azimuth, elevation)
                shadow_factor = np.random.uniform(0.3, 0.58)
                
                for i in range(c):
                    img_out[:, :, i] = np.where(mask == 255, img_out[:, :, i] * shadow_factor, img_out[:, :, i])
                    
            elif o_type == "cloud":
                opacity = np.random.uniform(self.cloud_opacity_min, self.cloud_opacity_max)
                mask = self._generate_cloud(img.shape, opacity)
                cloud_color = np.random.uniform(190, 245, size=(c,))
                
                for i in range(c):
                    # Blend original pixel with cloud color based on dynamic blur mask
                    img_out[:, :, i] = (1.0 - mask) * img_out[:, :, i] + mask * cloud_color[i]
                    
            else: # Tree Canopy
                mask, canopy_color = self._generate_tree_canopy(img.shape, self.foliage_season, self.tree_type)
                
                for i in range(c):
                    # Blend foliage color with ground pixels
                    img_out[:, :, i] = (1.0 - mask) * img_out[:, :, i] + mask * canopy_color[i]

        return np.clip(img_out, 0, 255).astype(np.uint8)


class RoadSegmentationDataset(Dataset):
    """
    Road Extraction dataset which loads satellite imagery tiles (SpaceNet/DeepGlobe format)
    and OpenStreetMap (OSM) ground-truth masks, applying synthetic occlusions to train 
    robust neural models.
    """
    def __init__(
        self, 
        image_dir: str, 
        mask_dir: str, 
        transform: A.Compose = None, 
        simulate_occlusion: bool = True
    ):
        self.image_dir = image_dir
        self.mask_dir = mask_dir
        self.transform = transform
        self.simulate_occlusion = simulate_occlusion
        self.images = sorted(os.listdir(image_dir))
        
        # Combined Occlusion simulator
        self.occlusion_transform = A.Compose([
            SyntheticOcclusion(num_occlusions=4, occlusion_type="random", p=0.7)
        ])

    def __len__(self) -> int:
        return len(self.images)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        img_name = self.images[idx]
        img_path = os.path.join(self.image_dir, img_name)
        mask_path = os.path.join(self.mask_dir, img_name) # Assuming same names

        # Read images
        image = cv2.imread(img_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        
        # Normalize mask to 0 or 1
        _, mask = cv2.threshold(mask, 127, 1, cv2.THRESH_BINARY)

        # Apply simulated occlusions to train for robustness
        if self.simulate_occlusion:
            augmented_img = self.occlusion_transform(image=image)["image"]
        else:
            augmented_img = image

        # Apply standard augmentations (flip, crop, normalize)
        if self.transform:
            augmented = self.transform(image=augmented_img, mask=mask)
            image_tensor = augmented["image"]
            mask_tensor = augmented["mask"].long()
        else:
            # Fallback to simple tensor conversion
            image_tensor = torch.from_numpy(augmented_img).permute(2, 0, 1).float() / 255.0
            mask_tensor = torch.from_numpy(mask).long()

        return image_tensor, mask_tensor


# =====================================================================
# Dice + IoU + Boundary-Aware Compound Loss Function
# =====================================================================

class DiceLoss(nn.Module):
    def __init__(self, smooth: float = 1e-6):
        super(DiceLoss, self).__init__()
        self.smooth = smooth

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        probs = torch.sigmoid(logits)
        probs = probs.view(-1)
        targets = targets.view(-1).float()
        
        intersection = (probs * targets).sum()
        dice = (2. * intersection + self.smooth) / (probs.sum() + targets.sum() + self.smooth)
        return 1.0 - dice


class IoULoss(nn.Module):
    def __init__(self, smooth: float = 1e-6):
        super(IoULoss, self).__init__()
        self.smooth = smooth

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        probs = torch.sigmoid(logits)
        probs = probs.view(-1)
        targets = targets.view(-1).float()
        
        intersection = (probs * targets).sum()
        union = probs.sum() + targets.sum() - intersection
        iou = (intersection + self.smooth) / (union + self.smooth)
        return 1.0 - iou


class BoundaryLoss(nn.Module):
    """
    Boundary-aware loss that enforces spatial consistency on road edge contours
    using a Laplacian or Sobel filtering approximation on logits vs. targets.
    """
    def __init__(self):
        super(BoundaryLoss, self).__init__()
        # Laplacian kernel for edge detection
        kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
        self.kernel = torch.from_numpy(kernel).unsqueeze(0).unsqueeze(0)

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        device = logits.device
        weight_kernel = self.kernel.to(device)
        
        probs = torch.sigmoid(logits)
        # Apply padding to maintain size
        padding = 1
        
        # Convolve to obtain boundary signals
        boundary_pred = torch.abs(nn.functional.conv2d(probs, weight_kernel, padding=padding))
        boundary_target = torch.abs(nn.functional.conv2d(targets.unsqueeze(1).float(), weight_kernel, padding=padding))
        
        # MSE loss on boundaries
        return nn.functional.mse_loss(boundary_pred, boundary_target)


class RoadExtractionResilienceLoss(nn.Module):
    """
    Dice + IoU + Boundary Loss Compound Function to capture thin road networks 
    and maintain boundary structure even in the presence of occlusion.
    """
    def __init__(self, w_dice: float = 0.4, w_iou: float = 0.4, w_bound: float = 0.2):
        super(RoadExtractionResilienceLoss, self).__init__()
        self.dice_loss = DiceLoss()
        self.iou_loss = IoULoss()
        self.boundary_loss = BoundaryLoss()
        self.weights = (w_dice, w_iou, w_bound)

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        l_dice = self.dice_loss(logits, targets)
        l_iou = self.iou_loss(logits, targets)
        l_bound = self.boundary_loss(logits, targets)
        
        total_loss = self.weights[0] * l_dice + self.weights[1] * l_bound + self.weights[2] * l_bound
        return total_loss


# =====================================================================
# Dummy/Placeholder model definition (to enable independent running)
# =====================================================================

class UNetResNet(nn.Module):
    """
    UNet segmentation architecture utilizing a pre-trained ResNet backbone 
    with skip connections (mimics segmentation_models_pytorch implementation).
    """
    def __init__(self, in_channels: int = 3, out_channels: int = 1):
        super(UNetResNet, self).__init__()
        
        # Simple encoder-decoder to maintain compile-ability without heavy libraries
        self.enc1 = nn.Sequential(
            nn.Conv2d(in_channels, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True)
        )
        self.pool = nn.MaxPool2d(2)
        
        self.enc2 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True)
        )
        
        self.bottleneck = nn.Sequential(
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True)
        )
        
        self.up2 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.dec2 = nn.Sequential(
            nn.Conv2d(256, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True)
        )
        
        self.up1 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.dec1 = nn.Sequential(
            nn.Conv2d(128, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, out_channels, kernel_size=1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x1 = self.enc1(x)
        x2 = self.pool(x1)
        x2 = self.enc2(x2)
        
        b = self.pool(x2)
        b = self.bottleneck(b)
        
        d2 = self.up2(b)
        d2 = torch.cat([d2, x2], dim=1) # skip-connection
        d2 = self.dec2(d2)
        
        d1 = self.up1(d2)
        d1 = torch.cat([d1, x1], dim=1) # skip-connection
        logits = self.dec1(d1)
        
        return logits


# =====================================================================
# Training & Validation Loops
# =====================================================================

def train_one_epoch(
    model: nn.Module, 
    dataloader: DataLoader, 
    optimizer: torch.optim.Optimizer, 
    criterion: nn.Module, 
    device: torch.device
) -> float:
    model.train()
    running_loss = 0.0
    
    for images, masks in dataloader:
        images = images.to(device)
        masks = masks.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        
        loss = criterion(outputs, masks)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        
    return running_loss / len(dataloader.dataset)


def validate(
    model: nn.Module, 
    dataloader: DataLoader, 
    criterion: nn.Module, 
    device: torch.device
) -> Tuple[float, float]:
    model.eval()
    running_loss = 0.0
    total_iou = 0.0
    total_samples = 0
    
    with torch.no_grad():
        for images, masks in dataloader:
            images = images.to(device)
            masks = masks.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, masks)
            running_loss += loss.item() * images.size(0)
            
            # Calculate IoU metric
            preds = (torch.sigmoid(outputs) > 0.5).long()
            intersection = (preds & masks).sum(dim=(2, 3)).float()
            union = (preds | masks).sum(dim=(2, 3)).float()
            
            iou = (intersection + 1e-6) / (union + 1e-6)
            total_iou += iou.sum().item()
            total_samples += images.size(0)
            
    return running_loss / len(dataloader.dataset), total_iou / total_samples


def run_pipeline():
    """
    Entry point to run the segmentation training pipeline.
    To use segmentation_models_pytorch, replace model instantiation with:
        import segmentation_models_pytorch as smp
        model = smp.Unet('resnet34', encoder_weights='imagenet', classes=1)
    """
    print("[Pipeline] Initializing Occlusion-Robust Segmentation Training...")
    
    # Configure directories
    os.makedirs("./data/images", exist_ok=True)
    os.makedirs("./data/masks", exist_ok=True)
    
    # Simple Albumentations transform suite
    train_transform = A.Compose([
        A.Resize(256, 256),
        A.HorizontalFlip(p=0.5),
        A.RandomBrightnessContrast(p=0.2),
        A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ToTensorV2(),
    ])
    
    # Load dataset
    # (Note: In actual execution, place SpaceNet/DeepGlobe files in ./data)
    try:
        dataset = RoadSegmentationDataset(
            image_dir="./data/images", 
            mask_dir="./data/masks", 
            transform=train_transform,
            simulate_occlusion=True
        )
        dataloader = DataLoader(dataset, batch_size=4, shuffle=True, num_workers=0)
        print(f"[Dataset] Configured successfully with {len(dataset)} items.")
    except Exception as e:
        print(f"[Dataset Warning] Datasets not fully populated. Mocking dataset execution. Error: {e}")
        return

    # Model, Optimizer, Loss Setup
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = UNetResNet(in_channels=3, out_channels=1).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)
    criterion = RoadExtractionResilienceLoss()
    
    print(f"[Training] Running on Device: {device}")
    epochs = 5
    for epoch in range(1, epochs + 1):
        loss = train_one_epoch(model, dataloader, optimizer, criterion, device)
        print(f"Epoch {epoch}/{epochs} | Compound Loss: {loss:.4f}")
        
    # Save the trained weights
    torch.save(model.state_dict(), "unet_road_resilience.pth")
    print("[Pipeline] Training Completed. Weights saved as unet_road_resilience.pth")


if __name__ == "__main__":
    run_pipeline()
