import React, { useState, useMemo, useEffect } from "react";
import {
  Activity,
  Compass,
  Cpu,
  Layers,
  ShieldAlert,
  Sparkles,
  Code2,
  Map as MapIcon,
  RefreshCw,
  Play,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  GitMerge,
  Download,
  Copy,
  PlusCircle,
  Trash2,
  ExternalLink,
  ChevronRight,
  FileCode,
  Shield,
  MapPin
} from "lucide-react";

// =====================================================================
// Static Python Code Definitions (To render in the Python Code Center)
// =====================================================================

const PYTHON_FILES = [
  {
    name: "train.py",
    description: "Phase 1: Occlusion-Robust PyTorch Segmentation Pipeline & Compound Losses",
    icon: FileCode,
    code: `import os
import cv2
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import albumentations as A
from albumentations.pytorch import ToTensorV2
from typing import Tuple, List, Dict, Any

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
        cx = np.random.randint(w // 5, 4 * w // 5)
        cy = np.random.randint(h // 5, 4 * h // 5)
        size = np.random.randint(15, 50)
        num_pts = np.random.randint(3, 6)
        angles = sorted([np.random.uniform(0, 2 * np.pi) for _ in range(num_pts)])
        pts = [[cx + int(size * np.cos(a)), cy + int(size * np.sin(a))] for a in angles]
        pts = np.array(pts, dtype=np.int32)
        theta = np.radians(90.0 - azimuth)
        shadow_len = int(np.random.uniform(25, 70) * (1.0 / np.tan(np.radians(max(5.0, elevation)))))
        dx, dy = int(shadow_len * np.cos(theta)), int(-shadow_len * np.sin(theta))
        projected_pts = pts + np.array([dx, dy])
        hull = cv2.convexHull(np.vstack([pts, projected_pts]))
        cv2.fillPoly(mask, [hull], 255)
        return mask

    def _generate_cloud(self, img_shape: Tuple[int, int, int], opacity: float) -> np.ndarray:
        h, w = img_shape[:2]
        mask = np.zeros((h, w), dtype=np.float32)
        num_blobs = np.random.randint(4, 7)
        cx = np.random.randint(w // 6, 5 * w // 6)
        cy = np.random.randint(h // 6, 5 * h // 6)
        for _ in range(num_blobs):
            bx = cx + np.random.randint(-35, 35)
            by = cy + np.random.randint(-35, 35)
            rx, ry = np.random.randint(25, 65), np.random.randint(15, 45)
            angle = np.random.randint(0, 360)
            blob_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.ellipse(blob_mask, (bx, by), (rx, ry), angle, 0, 360, 255, -1)
            mask = np.maximum(mask, blob_mask.astype(np.float32) / 255.0)
        edge_blur = np.random.randint(15, 65)
        if edge_blur % 2 == 0: edge_blur += 1
        return np.clip(cv2.GaussianBlur(mask, (edge_blur, edge_blur), 0) * opacity, 0.0, 1.0)

    def _generate_tree_canopy(self, img_shape: Tuple[int, int, int], season: str, t_type: str) -> Tuple[np.ndarray, np.ndarray]:
        h, w, c = img_shape
        mask = np.zeros((h, w), dtype=np.float32)
        if season == "random": season = np.random.choice(["summer", "autumn", "winter", "spring"])
        if t_type == "random": t_type = np.random.choice(["deciduous", "coniferous"])
        if t_type == "coniferous":
            canopy_color = np.array([16, 48, 14]) if c == 3 else np.array([40])
            density = np.random.uniform(0.85, 0.95)
            cx, cy, r = np.random.randint(w // 5, 4 * w // 5), np.random.randint(h // 5, 4 * w // 5), np.random.randint(15, 30)
            tree_mask = np.zeros((h, w), dtype=np.uint8)
            cv2.circle(tree_mask, (cx, cy), r, 255, -1)
            mask = np.maximum(mask, tree_mask.astype(np.float32) / 255.0)
        else:
            if season == "summer":
                canopy_color = np.array([34, 112, 34]) if c == 3 else np.array([75])
                density = np.random.uniform(0.80, 0.90)
            elif season == "autumn":
                canopy_color = np.random.choice([np.array([194, 91, 10]), np.array([150, 24, 8]), np.array([212, 168, 14])]) if c == 3 else np.array([110])
                density = np.random.uniform(0.45, 0.65)
            elif season == "winter":
                canopy_color = np.array([84, 69, 53]) if c == 3 else np.array([55])
                density = np.random.uniform(0.12, 0.28)
            else:
                canopy_color = np.array([107, 166, 75]) if c == 3 else np.array([90])
                density = np.random.uniform(0.60, 0.75)
            cx, cy, r = np.random.randint(w // 5, 4 * w // 5), np.random.randint(h // 5, 4 * w // 5), np.random.randint(22, 50)
            num_blobs = np.random.randint(3, 6)
            for _ in range(num_blobs):
                ccx = cx + np.random.randint(-12, 12)
                ccy = cy + np.random.randint(-12, 12)
                tree_mask = np.zeros((h, w), dtype=np.uint8)
                cv2.circle(tree_mask, (ccx, ccy), np.random.randint(r // 2, r), 255, -1)
                mask = np.maximum(mask, tree_mask.astype(np.float32) / 255.0)
        blur_size = 9 if t_type == "coniferous" else 15
        return np.clip(cv2.GaussianBlur(mask, (blur_size, blur_size), 0) * density, 0.0, 1.0), canopy_color

    def apply(self, img: np.ndarray, **params) -> np.ndarray:
        h, w, c = img.shape
        img_out = img.copy().astype(np.float32)
        for _ in range(np.random.randint(1, self.num_occlusions + 1)):
            o_type = self.occlusion_type
            if o_type == "random": o_type = np.random.choice(["shadow", "cloud", "tree"])
            if o_type == "shadow":
                azimuth = self.sun_azimuth if self.sun_azimuth is not None else np.random.uniform(0.0, 360.0)
                elevation = self.sun_elevation if self.sun_elevation is not None else np.random.uniform(15.0, 75.0)
                mask = self._generate_shadow(img.shape, azimuth, elevation)
                shadow_factor = np.random.uniform(0.3, 0.58)
                for i in range(c):
                    img_out[:, :, i] = np.where(mask == 255, img_out[:, :, i] * shadow_factor, img_out[:, :, i])
            elif o_type == "cloud":
                mask = self._generate_cloud(img.shape, np.random.uniform(self.cloud_opacity_min, self.cloud_opacity_max))
                cloud_color = np.random.uniform(190, 245, size=(c,))
                for i in range(c):
                    img_out[:, :, i] = (1.0 - mask) * img_out[:, :, i] + mask * cloud_color[i]
            else:
                mask, canopy_color = self._generate_tree_canopy(img.shape, self.foliage_season, self.tree_type)
                for i in range(c):
                    img_out[:, :, i] = (1.0 - mask) * img_out[:, :, i] + mask * canopy_color[i]
        return np.clip(img_out, 0, 255).astype(np.uint8)

class RoadSegmentationDataset(Dataset):
    """
    Loads raw tiles & OSM masks, dynamically creating occluded counterparts.
    """
    def __init__(self, image_dir, mask_dir, transform=None, simulate_occlusion=True):
        self.image_dir = image_dir
        self.mask_dir = mask_dir
        self.transform = transform
        self.simulate_occlusion = simulate_occlusion
        self.images = sorted(os.listdir(image_dir))
        self.occlusion_transform = A.Compose([SyntheticOcclusion(num_occlusions=4, occlusion_type="random", p=0.7)])

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_name = self.images[idx]
        image = cv2.cvtColor(cv2.imread(os.path.join(self.image_dir, img_name)), cv2.COLOR_BGR2RGB)
        mask = cv2.imread(os.path.join(self.mask_dir, img_name), cv2.IMREAD_GRAYSCALE)
        _, mask = cv2.threshold(mask, 127, 1, cv2.THRESH_BINARY)
        if self.simulate_occlusion:
            image = self.occlusion_transform(image=image)["image"]
        if self.transform:
            augmented = self.transform(image=image, mask=mask)
            return augmented["image"], augmented["mask"].long()
        return torch.from_numpy(image).permute(2, 0, 1).float() / 255.0, torch.from_numpy(mask).long()

class RoadExtractionResilienceLoss(nn.Module):
    """
    Dice + IoU + Boundary Boundary-Aware Loss formulation to preserve thin structures.
    """
    def __init__(self, w_dice=0.4, w_iou=0.4, w_bound=0.2):
        super().__init__()
        self.dice_loss = DiceLoss()
        self.iou_loss = IoULoss()
        self.boundary_loss = BoundaryLoss()
        self.weights = (w_dice, w_iou, w_bound)

    def forward(self, logits, targets):
        return (self.weights[0] * self.dice_loss(logits, targets) +
                self.weights[1] * self.iou_loss(logits, targets) +
                self.weights[2] * self.boundary_loss(logits, targets))`
  },
  {
    name: "graph_processing.py",
    description: "Phase 2: Morphological Centerline Skeletonization & MST Graph Healing Engine",
    icon: FileCode,
    code: `import numpy as np
import cv2
import networkx as nx
from skimage.morphology import skeletonize
from typing import Tuple, List

class DisjointSetUnion:
    """
    Fast DSU tracking path connectivity for topological healing.
    """
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i])
        return self.parent[i]

    def union(self, i, j):
        root_i, root_j = self.find(i), self.find(j)
        if root_i != root_j:
            if self.rank[root_i] < self.rank[root_j]:
                self.parent[root_i] = root_j
            elif self.rank[root_i] > self.rank[root_j]:
                self.parent[root_j] = root_i
            else:
                self.parent[root_j] = root_i
                self.rank[root_i] += 1
            return True
        return False

def extract_centerline_graph(binary_mask: np.ndarray) -> Tuple[nx.Graph, np.ndarray]:
    """
    Runs morphological skeletonization and maps intersections & endpoints into a Graph.
    """
    skeleton = skeletonize(binary_mask > 0).astype(np.uint8)
    h, w = skeleton.shape
    G = nx.Graph()
    kernel = np.array([[1, 1, 1], [1, 0, 1], [1, 1, 1]], dtype=np.uint8)
    neighbors = cv2.filter2D(skeleton.astype(np.float32), -1, kernel, borderType=cv2.BORDER_CONSTANT) * skeleton
    
    endpoints = np.argwhere(neighbors == 1)
    intersections = np.argwhere(neighbors >= 3)
    
    # Building nodes map and BFS tracer...
    # (Refer to full script inside /python_source/graph_processing.py)
    return G, skeleton

def heal_topological_gaps(G: nx.Graph, max_dist_px=40.0, max_angular_diff_deg=30.0):
    """
    DSU-driven Minimum Spanning Tree approximation for bridging occluded segments.
    """
    healed_G = G.copy()
    endpoints = [n for n, d in G.nodes(data=True) if d.get("type") == "endpoint"]
    if len(endpoints) < 2:
        return healed_G, []
    
    dsu = DisjointSetUnion(len(endpoints))
    # Connect current components...
    # Compute distances and headings of endpoint tangents to perform alignment validation
    return healed_G, added_bridges`
  },
  {
    name: "analysis.py",
    description: "Phase 3: Network Criticality Weighting & Node Ablation Stress Testing",
    icon: FileCode,
    code: `import networkx as nx
from typing import Dict, List, Tuple

def calculate_gatekeeper_nodes(G: nx.Graph) -> Dict[str, float]:
    """
    Computes weighted Betweenness Centrality to isolate critical hubs.
    """
    return nx.betweenness_centrality(G, weight="weight", normalized=True)

def simulate_node_ablation(G: nx.Graph, ablate_nodes: List[str]) -> nx.Graph:
    """
    Ablates nodes systematically to simulate extreme cascading blockages.
    """
    perturbed_G = G.copy()
    perturbed_G.remove_nodes_from(ablate_nodes)
    return perturbed_G

def calculate_resilience_index(baseline_G: nx.Graph, perturbed_G: nx.Graph) -> Tuple[float, float]:
    """
    Compares average shortest paths to compute global Resilience Index (R).
    """
    # Computes sub-graph penalized average shortest path lengths...
    # R = Baseline_Avg / Perturbed_Avg
    return R, travel_time_increase_pct`
  },
  {
    name: "utils.py",
    description: "Raster-to-Vector transformations and GeoJSON exporters",
    icon: FileCode,
    code: `import numpy as np
import networkx as nx
from typing import Dict, Tuple, Any

def pixel_to_coords(pixel_x, pixel_y, img_shape, bbox):
    """
    Translates local image coordinates to geographic lat/lon.
    """
    h, w = img_shape[:2]
    min_lat, min_lon, max_lat, max_lon = bbox
    lon = min_lon + (pixel_x / w) * (max_lon - min_lon)
    lat = max_lat - (pixel_y / h) * (max_lat - min_lat)
    return lat, lon

def convert_networkx_to_geojson(G, img_shape, bbox, centrality=None):
    """
    Returns high-performance GeoJSON payloads for Folium or Leaflet layers.
    """
    # Convert nodes to Points and edges to LineStrings...
    return geojson_dict`
  },
  {
    name: "app.py",
    description: "Phase 4: Streamlit & Streamlit-Folium Unified Analytical Dashboard",
    icon: FileCode,
    code: `import streamlit as st
import folium
from streamlit_folium import st_folium
import graph_processing as gp
import analysis as ga
import utils as gu

st.set_page_config(page_title="Route Resilience Analyzer", layout="wide")
st.title("🗺️ Route Resilience: Occlusion-Robust Road Extraction & Criticality")

# Render parameters, Phase 1 probability map thresholds, 
# Phase 2 centerline healers, and Phase 3 Leaflet map visualizations.
# (Refer to /python_source/app.py for complete server deployment scripts)`
  }
];

// =====================================================================
// Topological Road Healing Geometry Types & Segment Mock Database
// =====================================================================

interface Point {
  x: number;
  y: number;
}

interface RoadSegment {
  id: number;
  p1: Point;
  p2: Point;
}

interface HealedConnection {
  id: string;
  p1: Point;
  p2: Point;
  dist: string;
  angle: string;
}

const INITIAL_SEGMENTS: RoadSegment[] = [
  // Horizontal Road 1 (Top)
  { id: 1, p1: { x: 50, y: 100 }, p2: { x: 250, y: 100 } },
  { id: 2, p1: { x: 330, y: 110 }, p2: { x: 650, y: 100 } },
  
  // Diagonal Road (Middle)
  { id: 3, p1: { x: 80, y: 500 }, p2: { x: 250, y: 380 } },
  { id: 4, p1: { x: 310, y: 335 }, p2: { x: 550, y: 160 } },
  
  // Perpendicular Road (Intentionally confusing gap)
  { id: 5, p1: { x: 250, y: 200 }, p2: { x: 250, y: 320 } },
  
  // Horizontal Road 2 (Bottom - multi-gap)
  { id: 6, p1: { x: 100, y: 550 }, p2: { x: 250, y: 550 } },
  { id: 7, p1: { x: 300, y: 550 }, p2: { x: 450, y: 550 } },
  { id: 8, p1: { x: 580, y: 550 }, p2: { x: 700, y: 550 } },
];

// Vector Math Helpers
const getDistance = (p1: Point, p2: Point): number => Math.hypot(p2.x - p1.x, p2.y - p1.y);
const getVector = (from: Point, to: Point): Point => ({ x: to.x - from.x, y: to.y - from.y });
const getMagnitude = (v: Point): number => Math.sqrt(v.x * v.x + v.y * v.y);

const getAngle = (v1: Point, v2: Point): number => {
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = getMagnitude(v1) * getMagnitude(v2);
  if (mag === 0) return 0;
  let cos = dot / mag;
  cos = Math.max(-1, Math.min(1, cos)); // Clamp for float precision
  return Math.acos(cos) * (180 / Math.PI);
};

// =====================================================================
// Interactive Simulation Node Coordinates (Local 500x500 Grid)
// =====================================================================

interface GraphNode {
  id: string;
  x: number;
  y: number;
  type: "intersection" | "endpoint";
  label: string;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  isGap?: boolean; // Represents gap under canopy/cloud
}

const BASELINE_NODES: GraphNode[] = [
  { id: "A", x: 80, y: 100, type: "intersection", label: "Northern Junction (A)" },
  { id: "B", x: 250, y: 80, type: "intersection", label: "Central Expressway North (B)" },
  { id: "C", x: 420, y: 110, type: "intersection", label: "North-East Gateway (C)" },
  { id: "D", x: 90, y: 250, type: "intersection", label: "West Industrial Loop (D)" },
  { id: "E", x: 250, y: 250, type: "intersection", label: "Grand Hub Crossing (E)" }, // Bridge Node
  { id: "F", x: 410, y: 250, type: "intersection", label: "East Harbor Depot (F)" },
  { id: "G", x: 100, y: 400, type: "intersection", label: "South-West Junction (G)" },
  { id: "H", x: 250, y: 420, type: "intersection", label: "Central Parkway South (H)" },
  { id: "I", x: 400, y: 400, type: "intersection", label: "Emergency Supply Point (I)" },
  // Gap Endpoints (canopy occlusions)
  { id: "Gap1_L", x: 170, y: 180, type: "endpoint", label: "Upper Canopy Endpoint L" },
  { id: "Gap1_R", x: 215, y: 182, type: "endpoint", label: "Upper Canopy Endpoint R" },
  { id: "Gap2_L", x: 290, y: 340, type: "endpoint", label: "Lower Canopy Endpoint L" },
  { id: "Gap2_R", x: 330, y: 345, type: "endpoint", label: "Lower Canopy Endpoint R" },
];

const BASELINE_EDGES: GraphEdge[] = [
  { source: "A", target: "B", weight: 170 },
  { source: "B", target: "C", weight: 170 },
  { source: "A", target: "D", weight: 150 },
  { source: "D", target: "G", weight: 150 },
  { source: "C", target: "F", weight: 140 },
  { source: "F", target: "I", weight: 150 },
  { source: "G", target: "H", weight: 150 },
  { source: "H", target: "I", weight: 150 },
  // High-centrality critical corridors
  { source: "D", target: "E", weight: 160 },
  { source: "E", target: "F", weight: 160 },
  { source: "E", target: "H", weight: 170 },
  // Broken roads (leading to canopy occlusions)
  { source: "A", target: "Gap1_L", weight: 120 },
  { source: "B", target: "Gap1_R", weight: 110 },
  { source: "H", target: "Gap2_L", weight: 90 },
  { source: "I", target: "Gap2_R", weight: 110 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"segmentation" | "healing" | "criticality" | "code">("criticality");

  // --- Phase 1: Segmentation States ---
  const [canopyEnabled, setCanopyEnabled] = useState(true);
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);

  // --- Phase 2: Healing States ---
  const [maxHealDistance, setMaxHealDistance] = useState(100); // pixels
  const [maxAngularDeviation, setMaxAngularDeviation] = useState(30); // degrees
  const [healingApplied, setHealingApplied] = useState(true);

  // --- Phase 3: Stress Testing States ---
  const [ablatedNodes, setAblatedNodes] = useState<string[]>([]);
  const [routingOrigin, setRoutingOrigin] = useState<string>("A");
  const [routingDestination, setRoutingDestination] = useState<string>("I");
  const [routeVisualizationMode, setRouteVisualizationMode] = useState<string>("custom");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Determine actual routing origin & destination based on mode
  const { activeOrigin, activeDestination } = useMemo(() => {
    if (routeVisualizationMode === "custom") {
      return { activeOrigin: routingOrigin, activeDestination: routingDestination };
    }
    const [s, t] = routeVisualizationMode.split("-");
    return { activeOrigin: s, activeDestination: t };
  }, [routeVisualizationMode, routingOrigin, routingDestination]);

  // --- Code Center States ---
  const [selectedFileIndex, setSelectedFileIndex] = useState(2); // default analysis.py
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // =====================================================================
  // Dijkstra & Graph Theory Calculations in TypeScript
  // =====================================================================

  // Generate currently active edges (with healed edges and omitting ablated nodes)
  const currentGraph = useMemo(() => {
    const healedEdges: GraphEdge[] = [];

    // Rigorous implementation of the Topological Healing algorithm
    if (healingApplied) {
      // Look at Gap 1
      const g1L = BASELINE_NODES.find(n => n.id === "Gap1_L")!;
      const g1R = BASELINE_NODES.find(n => n.id === "Gap1_R")!;
      const d1 = getDistance(g1L, g1R);
      if (d1 <= maxHealDistance) {
        const aNode = BASELINE_NODES.find(n => n.id === "A")!;
        const bNode = BASELINE_NODES.find(n => n.id === "B")!;
        const vOut1 = getVector(aNode, g1L);
        const vOut2 = getVector(bNode, g1R);
        const vBridge = getVector(g1L, g1R);
        const vBridgeRev = getVector(g1R, g1L);
        const angle1 = getAngle(vOut1, vBridge);
        const angle2 = getAngle(vOut2, vBridgeRev);
        const alignmentError = Math.max(angle1, angle2);
        if (alignmentError <= maxAngularDeviation) {
          healedEdges.push({ source: "Gap1_L", target: "Gap1_R", weight: d1, isGap: true });
        }
      }

      // Look at Gap 2
      const g2L = BASELINE_NODES.find(n => n.id === "Gap2_L")!;
      const g2R = BASELINE_NODES.find(n => n.id === "Gap2_R")!;
      const d2 = getDistance(g2L, g2R);
      if (d2 <= maxHealDistance) {
        const hNode = BASELINE_NODES.find(n => n.id === "H")!;
        const iNode = BASELINE_NODES.find(n => n.id === "I")!;
        const vOut1 = getVector(hNode, g2L);
        const vOut2 = getVector(iNode, g2R);
        const vBridge = getVector(g2L, g2R);
        const vBridgeRev = getVector(g2R, g2L);
        const angle1 = getAngle(vOut1, vBridge);
        const angle2 = getAngle(vOut2, vBridgeRev);
        const alignmentError = Math.max(angle1, angle2);
        if (alignmentError <= maxAngularDeviation) {
          healedEdges.push({ source: "Gap2_L", target: "Gap2_R", weight: d2, isGap: true });
        }
      }
    }

    const allEdges = [...BASELINE_EDGES, ...healedEdges];

    // Filter out edges connecting to ablated nodes
    const activeEdges = allEdges.filter(
      edge => !ablatedNodes.includes(edge.source) && !ablatedNodes.includes(edge.target)
    );

    const activeNodes = BASELINE_NODES.filter(n => !ablatedNodes.includes(n.id));

    return { nodes: activeNodes, edges: activeEdges, healedEdges };
  }, [healingApplied, maxHealDistance, maxAngularDeviation, ablatedNodes]);

  // Betweenness Centrality computation using Brandes-like algorithm in TypeScript
  const betweennessCentrality = useMemo(() => {
    const nodes = BASELINE_NODES.map(n => n.id);
    const cb: Record<string, number> = {};
    const eb: Record<string, number> = {};
    nodes.forEach(n => { cb[n] = 0; });

    // For each pair, find all shortest paths
    // We only calculate shortest path counts on the HEALED graph (before ablation)
    // to mirror baseline criticality identification.
    const activeGraphEdges = [...BASELINE_EDGES, ...currentGraph.healedEdges];

    // Initialize edge centrality dictionary
    activeGraphEdges.forEach(e => {
      const u = e.source;
      const v = e.target;
      const key = u < v ? `${u}-${v}` : `${v}-${u}`;
      eb[key] = 0;
    });

    // Build adjacency list with weights
    const adj: Record<string, Array<{ to: string; w: number }>> = {};
    nodes.forEach(n => { adj[n] = []; });
    activeGraphEdges.forEach(e => {
      adj[e.source].push({ to: e.target, w: e.weight });
      adj[e.target].push({ to: e.source, w: e.weight });
    });

    // Run Dijkstra from each source
    nodes.forEach(s => {
      const dist: Record<string, number> = {};
      const paths: Record<string, string[][]> = {};
      nodes.forEach(n => {
        dist[n] = Infinity;
        paths[n] = [];
      });
      dist[s] = 0;
      paths[s] = [[s]];

      const queue: Array<{ id: string; d: number }> = [{ id: s, d: 0 }];

      while (queue.length > 0) {
        queue.sort((a, b) => a.d - b.d);
        const { id: u, d: d_u } = queue.shift()!;

        if (d_u > dist[u]) continue;

        adj[u].forEach(({ to: v, w }) => {
          if (dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            paths[v] = paths[u].map(p => [...p, v]);
            queue.push({ id: v, d: dist[v] });
          } else if (dist[u] + w === dist[v]) {
            paths[v].push(...paths[u].map(p => [...p, v]));
          }
        });
      }

      // Accumulate path fractions
      nodes.forEach(t => {
        if (s === t) return;
        const shortestPaths = paths[t];
        if (shortestPaths.length === 0) return;

        shortestPaths.forEach(p => {
          // Nodes:
          for (let i = 1; i < p.length - 1; i++) {
            const mediator = p[i];
            cb[mediator] += 1 / shortestPaths.length;
          }
          // Edges:
          for (let i = 0; i < p.length - 1; i++) {
            const u = p[i];
            const v = p[i + 1];
            const key = u < v ? `${u}-${v}` : `${v}-${u}`;
            if (eb[key] !== undefined) {
              eb[key] += 1 / shortestPaths.length;
            }
          }
        });
      });
    });

    // Normalize centrality
    const numPairs = (nodes.length - 1) * (nodes.length - 2);
    nodes.forEach(n => {
      cb[n] = numPairs > 0 ? cb[n] / numPairs : 0;
    });

    // Normalize edge centrality
    Object.keys(eb).forEach(k => {
      eb[k] = numPairs > 0 ? eb[k] / numPairs : 0;
    });

    return { nodeCentrality: cb, edgeCentrality: eb };
  }, [currentGraph]);

  // --- Phase 2: Healed Connections (Using INITIAL_SEGMENTS and exact user logic) ---
  const healedConnections = useMemo(() => {
    const connections: HealedConnection[] = [];
    if (!healingApplied) return connections;

    const segments = INITIAL_SEGMENTS;

    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const s1 = segments[i];
        const s2 = segments[j];

        // All 4 endpoint combinations
        const checks = [
          { s1Point: s1.p1, s1Neighbor: s1.p2, s2Point: s2.p1, s2Neighbor: s2.p2 },
          { s1Point: s1.p1, s1Neighbor: s1.p2, s2Point: s2.p2, s2Neighbor: s2.p1 },
          { s1Point: s1.p2, s1Neighbor: s1.p1, s2Point: s2.p1, s2Neighbor: s2.p2 },
          { s1Point: s1.p2, s1Neighbor: s1.p1, s2Point: s2.p2, s2Neighbor: s2.p1 },
        ];

        for (const check of checks) {
          const { s1Point, s1Neighbor, s2Point, s2Neighbor } = check;
          
          const dist = getDistance(s1Point, s2Point);
          
          if (dist <= maxHealDistance) {
            // Outward vector from s1Point
            const vOut1 = getVector(s1Neighbor, s1Point);
            // Outward vector from s2Point
            const vOut2 = getVector(s2Neighbor, s2Point);
            
            // Bridge vector from s1Point to s2Point
            const vBridge = getVector(s1Point, s2Point);
            // Bridge vector from s2Point to s1Point (reverse)
            const vBridgeRev = getVector(s2Point, s1Point);

            // Angle alignment error check
            const angle1 = getAngle(vOut1, vBridge);
            const angle2 = getAngle(vOut2, vBridgeRev);
            const alignmentError = Math.max(angle1, angle2);

            if (alignmentError <= maxAngularDeviation) {
              connections.push({
                id: `heal-${s1.id}-${s2.id}-${dist}`,
                p1: s1Point,
                p2: s2Point,
                dist: dist.toFixed(1),
                angle: alignmentError.toFixed(1)
              });
              // Break early to avoid double-connecting the same segment pair confusingly
              break; 
            }
          }
        }
      }
    }
    return connections;
  }, [maxHealDistance, maxAngularDeviation, healingApplied]);

  // Compute Shortest Route between Origin and Destination on active (possibly ablated) graph
  const activeRouteResult = useMemo(() => {
    const nodes = BASELINE_NODES.map(n => n.id);
    const adj: Record<string, Array<{ to: string; w: number }>> = {};
    nodes.forEach(n => { adj[n] = []; });

    // Map active edges
    currentGraph.edges.forEach(e => {
      adj[e.source].push({ to: e.target, w: e.weight });
      adj[e.target].push({ to: e.source, w: e.weight });
    });

    // Dijkstra algorithm
    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    nodes.forEach(n => {
      dist[n] = Infinity;
      prev[n] = null;
    });
    dist[activeOrigin] = 0;

    const queue: Array<{ id: string; d: number }> = [{ id: activeOrigin, d: 0 }];

    while (queue.length > 0) {
      queue.sort((a, b) => a.d - b.d);
      const { id: u, d: d_u } = queue.shift()!;

      if (d_u > dist[u]) continue;

      adj[u].forEach(({ to: v, w }) => {
        if (dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          prev[v] = u;
          queue.push({ id: v, d: dist[v] });
        }
      });
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = activeDestination;
    if (dist[activeDestination] !== Infinity) {
      while (curr !== null) {
        path.unshift(curr);
        curr = prev[curr];
      }
    }

    return { path, cost: dist[activeDestination] };
  }, [currentGraph, activeOrigin, activeDestination]);

  // Compute Shortest Route on Healed baseline graph (for resilience R base comparison)
  const baselineRouteCost = useMemo(() => {
    // Baseline includes all original edges + healed edges (if healingApplied)
    const healedEdges: GraphEdge[] = [];
    if (healingApplied) {
      const g1L = BASELINE_NODES.find(n => n.id === "Gap1_L")!;
      const g1R = BASELINE_NODES.find(n => n.id === "Gap1_R")!;
      if (Math.sqrt(Math.pow(g1L.x - g1R.x, 2) + Math.pow(g1L.y - g1R.y, 2)) <= maxHealDistance) {
        healedEdges.push({ source: "Gap1_L", target: "Gap1_R", weight: 45 });
      }
      const g2L = BASELINE_NODES.find(n => n.id === "Gap2_L")!;
      const g2R = BASELINE_NODES.find(n => n.id === "Gap2_R")!;
      if (Math.sqrt(Math.pow(g2L.x - g2R.x, 2) + Math.pow(g2L.y - g2R.y, 2)) <= maxHealDistance) {
        healedEdges.push({ source: "Gap2_L", target: "Gap2_R", weight: 40 });
      }
    }
    const baseAllEdges = [...BASELINE_EDGES, ...healedEdges];

    const nodes = BASELINE_NODES.map(n => n.id);
    const adj: Record<string, Array<{ to: string; w: number }>> = {};
    nodes.forEach(n => { adj[n] = []; });
    baseAllEdges.forEach(e => {
      adj[e.source].push({ to: e.target, w: e.weight });
      adj[e.target].push({ to: e.source, w: e.weight });
    });

    const dist: Record<string, number> = {};
    nodes.forEach(n => { dist[n] = Infinity; });
    dist[activeOrigin] = 0;

    const queue: Array<{ id: string; d: number }> = [{ id: activeOrigin, d: 0 }];

    while (queue.length > 0) {
      queue.sort((a, b) => a.d - b.d);
      const { id: u, d: d_u } = queue.shift()!;
      if (d_u > dist[u]) continue;

      adj[u].forEach(({ to: v, w }) => {
        if (dist[u] + w < dist[v]) {
          dist[v] = dist[u] + w;
          queue.push({ id: v, d: dist[v] });
        }
      });
    }

    return dist[activeDestination];
  }, [healingApplied, maxHealDistance, activeOrigin, activeDestination]);

  // Calculate Global Resilience Index (R) and detour average
  const globalResilienceIndex = useMemo(() => {
    // Calculates a representation of network resilience based on average shortest path distances
    // of all pairs on the baseline healed graph versus current ablated graph.
    const allNodes = BASELINE_NODES.map(n => n.id);
    
    // We compute average path lengths
    const getAvgShortestPath = (edgesList: GraphEdge[], nodesList: string[]) => {
      const adj: Record<string, Array<{ to: string; w: number }>> = {};
      nodesList.forEach(n => { adj[n] = []; });
      edgesList.forEach(e => {
        if (nodesList.includes(e.source) && nodesList.includes(e.target)) {
          adj[e.source].push({ to: e.target, w: e.weight });
          adj[e.target].push({ to: e.source, w: e.weight });
        }
      });

      let totalPathSum = 0;
      let connectedPairs = 0;

      nodesList.forEach(s => {
        const dist: Record<string, number> = {};
        nodesList.forEach(n => { dist[n] = Infinity; });
        dist[s] = 0;

        const queue = [{ id: s, d: 0 }];
        while (queue.length > 0) {
          queue.sort((a, b) => a.d - b.d);
          const { id: u, d: d_u } = queue.shift()!;
          if (d_u > dist[u]) continue;

          adj[u].forEach(({ to: v, w }) => {
            if (dist[u] + w < dist[v]) {
              dist[v] = dist[u] + w;
              queue.push({ id: v, d: dist[v] });
            }
          });
        }

        nodesList.forEach(t => {
          if (s !== t && dist[t] !== Infinity) {
            totalPathSum += dist[t];
            connectedPairs++;
          }
        });
      });

      return connectedPairs > 0 ? totalPathSum / connectedPairs : Infinity;
    };

    // Baseline edges
    const healedEdges: GraphEdge[] = [];
    if (healingApplied) {
      const g1L = BASELINE_NODES.find(n => n.id === "Gap1_L")!;
      const g1R = BASELINE_NODES.find(n => n.id === "Gap1_R")!;
      if (Math.sqrt(Math.pow(g1L.x - g1R.x, 2) + Math.pow(g1L.y - g1R.y, 2)) <= maxHealDistance) {
        healedEdges.push({ source: "Gap1_L", target: "Gap1_R", weight: 45 });
      }
      const g2L = BASELINE_NODES.find(n => n.id === "Gap2_L")!;
      const g2R = BASELINE_NODES.find(n => n.id === "Gap2_R")!;
      if (Math.sqrt(Math.pow(g2L.x - g2R.x, 2) + Math.pow(g2L.y - g2R.y, 2)) <= maxHealDistance) {
        healedEdges.push({ source: "Gap2_L", target: "Gap2_R", weight: 40 });
      }
    }
    const baseAllEdges = [...BASELINE_EDGES, ...healedEdges];

    const avgBase = getAvgShortestPath(baseAllEdges, allNodes);
    const avgPert = getAvgShortestPath(currentGraph.edges, currentGraph.nodes.map(n => n.id));

    if (avgPert === Infinity) return { R: 0, detourPercent: 999 };
    if (avgBase === Infinity || avgBase === 0) return { R: 1, detourPercent: 0 };

    const R = avgBase / avgPert;
    const detourPercent = ((avgPert - avgBase) / avgBase) * 100;

    return {
      R: Math.max(0, Math.min(1, R)),
      detourPercent: Math.max(0, detourPercent)
    };
  }, [currentGraph, healingApplied, maxHealDistance]);

  // Recalculate shortest paths for representative origin-destination pairs
  const representativeOdResults = useMemo(() => {
    // 1. Setup baseline graph adjacency list (including healed edges if applicable)
    const baseNodes = BASELINE_NODES.map(n => n.id);
    const healedEdges: GraphEdge[] = [];
    if (healingApplied) {
      const g1L = BASELINE_NODES.find(n => n.id === "Gap1_L")!;
      const g1R = BASELINE_NODES.find(n => n.id === "Gap1_R")!;
      if (Math.sqrt(Math.pow(g1L.x - g1R.x, 2) + Math.pow(g1L.y - g1R.y, 2)) <= maxHealDistance) {
        healedEdges.push({ source: "Gap1_L", target: "Gap1_R", weight: 45 });
      }
      const g2L = BASELINE_NODES.find(n => n.id === "Gap2_L")!;
      const g2R = BASELINE_NODES.find(n => n.id === "Gap2_R")!;
      if (Math.sqrt(Math.pow(g2L.x - g2R.x, 2) + Math.pow(g2L.y - g2R.y, 2)) <= maxHealDistance) {
        healedEdges.push({ source: "Gap2_L", target: "Gap2_R", weight: 40 });
      }
    }
    const baseEdges = [...BASELINE_EDGES, ...healedEdges];
    
    const baseAdj: Record<string, Array<{ to: string; w: number }>> = {};
    baseNodes.forEach(n => { baseAdj[n] = []; });
    baseEdges.forEach(e => {
      baseAdj[e.source].push({ to: e.target, w: e.weight });
      baseAdj[e.target].push({ to: e.source, w: e.weight });
    });

    // 2. Setup perturbed graph adjacency list
    const pertAdj: Record<string, Array<{ to: string; w: number }>> = {};
    baseNodes.forEach(n => { pertAdj[n] = []; }); // keep all slots to avoid crashes
    currentGraph.edges.forEach(e => {
      pertAdj[e.source].push({ to: e.target, w: e.weight });
      pertAdj[e.target].push({ to: e.source, w: e.weight });
    });

    const runDijkstra = (adj: Record<string, Array<{ to: string; w: number }>>, start: string, end: string) => {
      const dist: Record<string, number> = {};
      const prev: Record<string, string | null> = {};
      baseNodes.forEach(n => {
        dist[n] = Infinity;
        prev[n] = null;
      });
      dist[start] = 0;

      const queue: Array<{ id: string; d: number }> = [{ id: start, d: 0 }];

      while (queue.length > 0) {
        queue.sort((a, b) => a.d - b.d);
        const { id: u, d: d_u } = queue.shift()!;
        if (d_u > dist[u]) continue;

        (adj[u] || []).forEach(({ to: v, w }) => {
          if (dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            prev[v] = u;
            queue.push({ id: v, d: dist[v] });
          }
        });
      }

      const path: string[] = [];
      let curr: string | null = end;
      if (dist[end] !== Infinity) {
        while (curr !== null) {
          path.unshift(curr);
          curr = prev[curr];
        }
      }
      return { path, cost: dist[end] };
    };

    const representativePairs = [
      { s: "A", t: "I" },
      { s: "G", t: "C" },
      { s: "B", t: "H" },
      { s: "D", t: "F" },
      { s: "A", t: "F" }
    ];

    const results = representativePairs.map(({ s, t }) => {
      const baseResult = runDijkstra(baseAdj, s, t);
      const pertResult = runDijkstra(pertAdj, s, t);

      const isAffected = 
        baseResult.path.some(node => ablatedNodes.includes(node)) || 
        pertResult.cost > baseResult.cost || 
        pertResult.cost === Infinity;

      return {
        source: s,
        target: t,
        basePath: baseResult.path,
        baseCost: baseResult.cost,
        pertPath: pertResult.path,
        pertCost: pertResult.cost,
        isAffected,
        status: pertResult.cost === Infinity ? "Disconnected" : isAffected ? "Detoured" : "Unchanged"
      };
    });

    const affected = results.filter(r => r.isAffected);
    let totalBaseTime = 0;
    let totalPertTime = 0;
    
    affected.forEach(r => {
      totalBaseTime += r.baseCost;
      if (r.pertCost === Infinity) {
        totalPertTime += r.baseCost * 3.0; // 3.0x penalty multiplier for disconnections
      } else {
        totalPertTime += r.pertCost;
      }
    });

    const increasePct = totalBaseTime > 0 ? ((totalPertTime - totalBaseTime) / totalBaseTime) * 100 : 0;
    const increaseAbs = totalBaseTime > 0 ? (totalPertTime - totalBaseTime) : 0;

    return {
      results,
      affected,
      increasePct,
      increaseAbs
    };
  }, [currentGraph, ablatedNodes, healingApplied, maxHealDistance]);

  // Compute number of isolated subgraphs/components in the active graph
  const componentsCount = useMemo(() => {
    const nodes = currentGraph.nodes.map(n => n.id);
    const visited = new Set<string>();
    let count = 0;

    const adj: Record<string, string[]> = {};
    nodes.forEach(n => { adj[n] = []; });
    currentGraph.edges.forEach(e => {
      adj[e.source].push(e.target);
      adj[e.target].push(e.source);
    });

    const dfs = (u: string) => {
      visited.add(u);
      adj[u].forEach(v => {
        if (!visited.has(v)) {
          dfs(v);
        }
      });
    };

    nodes.forEach(n => {
      if (!visited.has(n)) {
        count++;
        dfs(n);
      }
    });

    return count;
  }, [currentGraph]);

  // Toggle node ablation
  const handleNodeClick = (nodeId: string) => {
    // If clicking a gap endpoint, let user know
    if (nodeId.startsWith("Gap") && !healingApplied) {
      return; // Cannot ablate broken gaps that aren't healed anyway
    }

    if (ablatedNodes.includes(nodeId)) {
      setAblatedNodes(prev => prev.filter(n => n !== nodeId));
    } else {
      setAblatedNodes(prev => [...prev, nodeId]);
      // Avoid routing starting/ending on ablated node
      if (routingOrigin === nodeId) {
        const nextNode = BASELINE_NODES.find(n => n.id !== nodeId && !ablatedNodes.includes(n.id))?.id || "A";
        setRoutingOrigin(nextNode);
      }
      if (routingDestination === nodeId) {
        const nextNode = BASELINE_NODES.find(n => n.id !== nodeId && !ablatedNodes.includes(n.id) && n.id !== routingOrigin)?.id || "I";
        setRoutingDestination(nextNode);
      }
    }
  };

  // Generate AI scenario planning advisor brief
  const generateAIPlan = async () => {
    setAiReportLoading(true);
    setAiReport(null);
    try {
      const response = await fetch("/api/analyze-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ablatedNodes,
          baselinePath: BASELINE_NODES.map(n => n.id).filter(id => !ablatedNodes.includes(id)),
          detourPath: activeRouteResult.path,
          resilienceIndex: globalResilienceIndex.R,
          detourPercentage: globalResilienceIndex.detourPercent,
          healedGaps: currentGraph.healedEdges.map(e => `${e.source}↔${e.target}`)
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiReport(data.analysis);
      } else {
        setAiReport(`### ⚠️ AI Advisor System Offline\n\n${data.error || "Please verify your server console or configure GEMINI_API_KEY in the Secrets panel."}`);
      }
    } catch (err: any) {
      console.error(err);
      setAiReport(`### ❌ Connection Error\n\nFailed to reach the server-side AI analyst. Make sure the development server is running successfully.`);
    } finally {
      setAiReportLoading(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* HEADER SECTION */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">
                Geospatial Pipeline Online
              </span>
              <span className="text-slate-500 text-xs font-mono">• v1.0.0 (Python + Node.js)</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="w-6 h-6 text-cyan-400" />
              Route Resilience Analyzer
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Occlusion-Robust Road Extraction & Graph-Theoretic Criticality Analysis for Urban Mobility Systems.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAblatedNodes([]);
                setHealingApplied(true);
                setMaxHealDistance(65);
                setMaxAngularDeviation(30);
                setAiReport(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset System
            </button>
            <a
              href="#code_center"
              onClick={() => setActiveTab("code")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-lg shadow-cyan-500/10"
            >
              <Download className="w-3.5 h-3.5" />
              Get Python Scripts
            </a>
          </div>
        </div>
      </header>

      {/* PIPELINE STEP SWITCHER */}
      <nav className="border-b border-slate-800 bg-slate-900/20 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("segmentation")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "segmentation"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            Phase 1: Occlusion Segmentation
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />
          
          <button
            onClick={() => setActiveTab("healing")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "healing"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <GitMerge className="w-4 h-4 text-cyan-400" />
            Phase 2: Topological Healing
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />

          <button
            onClick={() => setActiveTab("criticality")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "criticality"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Activity className="w-4 h-4 text-red-400" />
            Phase 3: Criticality & Stress Testing
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />

          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ml-auto ${
              activeTab === "code"
                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
            }`}
          >
            <Code2 className="w-4 h-4" />
            Python Code Center
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* =====================================================================
            TAB 1: OCCLUSION SEGMENTATION PIPELINE
            ===================================================================== */}
        {activeTab === "segmentation" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Control Sidebar Column */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-5 h-fit">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Occlusion Simulators
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Toggle urban barriers in the satellite feed to simulate synthetic obstructions. Watch U-Net adaptively extract road networks.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-900 cursor-pointer transition-all">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-white">Dense Tree Canopy</span>
                    <span className="text-[10px] text-slate-500">Green foliage obscuring asphalt</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={canopyEnabled}
                    onChange={(e) => setCanopyEnabled(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-900 cursor-pointer transition-all">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-white">Building Shadows</span>
                    <span className="text-[10px] text-slate-500">High-contrast sun casts</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={shadowEnabled}
                    onChange={(e) => setShadowEnabled(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 w-4 h-4"
                  />
                </label>
              </div>

              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300">Binarization Threshold</span>
                  <span className="font-mono text-cyan-400 font-semibold">{confidenceThreshold}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Pixels above this prediction certainty are classified as roads. Lowering this increases road coverage but introduces false positive noise.
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-4 bg-slate-950/20 p-3 rounded-lg">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
                  Compound Loss Weights
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/60">
                    <div className="text-slate-500">Dice</div>
                    <div className="text-cyan-400 font-bold">40%</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/60">
                    <div className="text-slate-500">IoU</div>
                    <div className="text-cyan-400 font-bold">40%</div>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/60">
                    <div className="text-slate-500">Boundary</div>
                    <div className="text-cyan-400 font-bold">20%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Output Columns */}
            <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-6">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Layers className="w-4.5 h-4.5 text-cyan-400" />
                Dual-Stage Pipeline Visualizer
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual A: Input with Occlusions */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    1. Satellite Image Tile
                    <span className="text-[10px] font-mono text-slate-500">Original Raster</span>
                  </span>
                  
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                    {/* Simulated Satellite Image */}
                    <svg className="w-full h-full" viewBox="0 0 400 225">
                      <rect width="400" height="225" fill="#18181b" />
                      {/* Water/Park backgrounds */}
                      <rect x="0" y="160" width="130" height="65" fill="#0f172a" opacity="0.4" />
                      <circle cx="340" cy="50" r="40" fill="#052e16" opacity="0.3" />
                      
                      {/* Road networks */}
                      <path d="M 50,0 Q 150,112 350,225" stroke="#3f3f46" strokeWidth="12" fill="none" />
                      <line x1="0" y1="112" x2="400" y2="112" stroke="#3f3f46" strokeWidth="12" />
                      <line x1="280" y1="0" x2="280" y2="225" stroke="#3f3f46" strokeWidth="12" />

                      {/* Road markings */}
                      <path d="M 50,0 Q 150,112 350,225" stroke="#fbbf24" strokeWidth="1" strokeDasharray="6,6" fill="none" />
                      <line x1="0" y1="112" x2="400" y2="112" stroke="#fff" strokeWidth="1" strokeDasharray="8,8" />

                      {/* Tree Canopy Overlay */}
                      {canopyEnabled && (
                        <g opacity="0.85">
                          <circle cx="150" cy="112" r="28" fill="#14532d" />
                          <circle cx="165" cy="100" r="22" fill="#166534" />
                          <circle cx="138" cy="120" r="24" fill="#15803d" />
                        </g>
                      )}

                      {/* Shadow Cast Overlay */}
                      {shadowEnabled && (
                        <polygon points="260,30 330,30 290,130 220,130" fill="#020617" opacity="0.75" />
                      )}
                    </svg>

                    {/* Overlay tags */}
                    <div className="absolute top-3 left-3 bg-slate-900/90 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                      Raster Input
                    </div>
                  </div>
                </div>

                {/* Visual B: Binary Mask */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    2. Extracted Road Mask
                    <span className="text-[10px] font-mono text-cyan-400">U-Net Compound Prediction</span>
                  </span>

                  <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 400 225">
                      <rect width="400" height="225" fill="#09090b" />
                      
                      {/* Extracted roads: if occlusion is on, show breakages depending on threshold */}
                      {/* Road 1: Diagonal */}
                      {(!canopyEnabled || confidenceThreshold < 0.3) ? (
                        <path d="M 50,0 Q 150,112 350,225" stroke="#fff" strokeWidth="6" fill="none" />
                      ) : (
                        <g>
                          {/* Cut out road around cx=150, cy=112 */}
                          <path d="M 50,0 Q 100,50 120,70" stroke="#fff" strokeWidth="6" fill="none" />
                          {confidenceThreshold < 0.6 && (
                            <path d="M 120,70 Q 150,112 180,135" stroke="#fff" strokeWidth="3" opacity="0.4" strokeDasharray="3,3" fill="none" />
                          )}
                          <path d="M 180,135 Q 260,165 350,225" stroke="#fff" strokeWidth="6" fill="none" />
                        </g>
                      )}

                      {/* Road 2: Horizontal */}
                      {(!canopyEnabled || confidenceThreshold < 0.3) ? (
                        <line x1="0" y1="112" x2="400" y2="112" stroke="#fff" strokeWidth="6" />
                      ) : (
                        <g>
                          <line x1="0" y1="112" x2="110" y2="112" stroke="#fff" strokeWidth="6" />
                          {/* Canopy gap */}
                          {confidenceThreshold < 0.6 && (
                            <line x1="110" y1="112" x2="190" y2="112" stroke="#fff" strokeWidth="2" opacity="0.3" strokeDasharray="4,4" />
                          )}
                          <line x1="190" y1="112" x2="400" y2="112" stroke="#fff" strokeWidth="6" />
                        </g>
                      )}

                      {/* Road 3: Vertical */}
                      {(!shadowEnabled || confidenceThreshold < 0.3) ? (
                        <line x1="280" y1="0" x2="280" y2="225" stroke="#fff" strokeWidth="6" />
                      ) : (
                        <g>
                          <line x1="280" y1="0" x2="280" y2="45" stroke="#fff" strokeWidth="6" />
                          {/* Shadow gap */}
                          {confidenceThreshold < 0.55 && (
                            <line x1="280" y1="45" x2="280" y2="115" stroke="#fff" strokeWidth="3" opacity="0.5" strokeDasharray="2,2" />
                          )}
                          <line x1="280" y1="115" x2="280" y2="225" stroke="#fff" strokeWidth="6" />
                        </g>
                      )}
                    </svg>

                    <div className="absolute top-3 left-3 bg-cyan-950/90 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/20">
                      Binary Mask Output
                    </div>
                  </div>
                </div>
              </div>

              {/* Loss functions descriptions */}
              <div className="border-t border-slate-800/80 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/30">
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Dice Loss
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Maximizes intersection-over-union overlaps directly, heavily penalizing global scale segment imbalances.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/30">
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    IoU Loss
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Operates in tandem with Dice, focusing directly on reducing false positives in highly occluded blocks.
                  </p>
                </div>
                <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/30">
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Boundary-Aware Loss
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Applies Sobel/Laplacian kernels to logits, penalizing fuzzy road edges to force sharp road boundaries.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: TOPOLOGICAL HEALING ENGINE
            ===================================================================== */}
        {activeTab === "healing" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
            {/* Control Sidebar */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-6 shadow-xl h-fit">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-1.5">
                  <GitMerge className="w-4.5 h-4.5 text-blue-400" />
                  Healing Parameters
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Controls how disjointed skeletal centerline segments are merged. Connections form only when endpoints satisfy both distance proximity and trajectory constraints.
                </p>
              </div>

              {/* Toggle switch for Healing */}
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-900/50 cursor-pointer transition-all">
                <span className="text-xs font-semibold text-white">Topological Healing</span>
                <input
                  type="checkbox"
                  checked={healingApplied}
                  onChange={(e) => setHealingApplied(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              {/* Max Distance px */}
              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300">Max Gap Distance</span>
                  <span className="font-mono text-blue-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 font-semibold">{maxHealDistance} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="250"
                  value={maxHealDistance}
                  onChange={(e) => setMaxHealDistance(parseInt(e.target.value))}
                  disabled={!healingApplied}
                  className="w-full accent-blue-500 disabled:opacity-30 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Maximum Euclidean distance between endpoints to allow a centerline connection.
                </p>
              </div>

              {/* Max Angular Deviation */}
              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300">Max Alignment Angle</span>
                  <span className="font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 font-semibold">{maxAngularDeviation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={maxAngularDeviation}
                  onChange={(e) => setMaxAngularDeviation(parseInt(e.target.value))}
                  disabled={!healingApplied}
                  className="w-full accent-emerald-500 disabled:opacity-30 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Maximum deviation angle allowed between the road trajectory and the bridged gap vector.
                </p>
              </div>

              {/* Stats Panel */}
              <div className="border-t border-slate-800/80 pt-4 space-y-2.5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                  DSU Connectivity Stats
                </span>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Broken Segments:</span>
                    <span className="text-white font-mono font-medium">{INITIAL_SEGMENTS.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Healed Gaps:</span>
                    <span className="text-emerald-400 font-bold font-mono">+{healedConnections.length}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-900 pt-2 mt-1">
                    <span className="text-slate-400">Separate Components:</span>
                    <span className={`font-mono font-bold ${INITIAL_SEGMENTS.length - healedConnections.length === 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {INITIAL_SEGMENTS.length - healedConnections.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Canvas Column */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
              <h3 className="text-sm font-semibold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4.5 h-4.5 text-blue-400" />
                  Topological Road Healing Simulator
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400">
                  active healing topology
                </span>
              </h3>

              {/* Vector Alignment SVG Canvas */}
              <div className="relative border border-slate-800 bg-slate-950 rounded-xl overflow-hidden aspect-video">
                <svg 
                  viewBox="0 0 800 650" 
                  className="w-full h-full bg-[#0a0f1a]"
                >
                  <defs>
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                    </pattern>
                    <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  <rect width="100%" height="100%" fill="url(#grid-pattern)" />

                  {/* Draw Healed Connections */}
                  {healedConnections.map((conn) => (
                    <g key={conn.id}>
                      {/* Outer animated neon glow line */}
                      <line 
                        x1={conn.p1.x} 
                        y1={conn.p1.y} 
                        x2={conn.p2.x} 
                        y2={conn.p2.y} 
                        stroke="#10b981" 
                        strokeWidth="5"
                        strokeDasharray="8 6"
                        className="opacity-40 animate-pulse"
                        filter="url(#glow-filter)"
                      />
                      {/* Core sharp dashed line */}
                      <line 
                        x1={conn.p1.x} 
                        y1={conn.p1.y} 
                        x2={conn.p2.x} 
                        y2={conn.p2.y} 
                        stroke="#34d399" 
                        strokeWidth="2.5"
                        strokeDasharray="5, 3"
                      />
                      {/* Connection Metrics Floating Badge */}
                      <g>
                        <rect
                          x={(conn.p1.x + conn.p2.x) / 2 - 45}
                          y={(conn.p1.y + conn.p2.y) / 2 - 18}
                          width="90"
                          height="16"
                          rx="3"
                          fill="#0f172a"
                          stroke="#10b981"
                          strokeWidth="1"
                          className="opacity-95"
                        />
                        <text 
                          x={(conn.p1.x + conn.p2.x) / 2} 
                          y={(conn.p1.y + conn.p2.y) / 2 - 6} 
                          fill="#34d399" 
                          fontSize="9" 
                          textAnchor="middle"
                          className="font-mono font-bold"
                        >
                          {conn.dist}px | {conn.angle}°
                        </text>
                      </g>
                    </g>
                  ))}

                  {/* Draw Original Broken Segments */}
                  {INITIAL_SEGMENTS.map((seg) => (
                    <g key={seg.id}>
                      {/* Outer structural backdrop shadow */}
                      <line 
                        x1={seg.p1.x} 
                        y1={seg.p1.y} 
                        x2={seg.p2.x} 
                        y2={seg.p2.y} 
                        stroke="#1e293b" 
                        strokeWidth="8" 
                        strokeLinecap="round"
                        opacity="0.4"
                      />
                      {/* Core structural segment road line */}
                      <line 
                        x1={seg.p1.x} 
                        y1={seg.p1.y} 
                        x2={seg.p2.x} 
                        y2={seg.p2.y} 
                        stroke="#64748b" 
                        strokeWidth="5" 
                        strokeLinecap="round"
                      />
                      {/* Anchor endpoints */}
                      <circle cx={seg.p1.x} cy={seg.p1.y} r="5.5" fill="#3b82f6" stroke="#0b0f19" strokeWidth="1.5" />
                      <circle cx={seg.p2.x} cy={seg.p2.y} r="5.5" fill="#3b82f6" stroke="#0b0f19" strokeWidth="1.5" />
                      
                      {/* Segment Labels */}
                      <text
                        x={(seg.p1.x + seg.p2.x) / 2}
                        y={(seg.p1.y + seg.p2.y) / 2 - 10}
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        Seg {seg.id}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Legend Overlay */}
                <div className="absolute bottom-4 left-4 flex gap-4 text-[10px] bg-slate-950/90 px-3 py-2 rounded-lg border border-slate-800 font-mono shadow-md">
                   <div className="flex items-center gap-2">
                     <div className="w-3.5 h-1.5 bg-slate-500 rounded-sm"></div>
                     <span className="text-slate-300">Extracted Centerlines</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3.5 h-1 border-b-2 border-dashed border-emerald-500"></div>
                     <span className="text-slate-300">Healed Topology</span>
                   </div>
                </div>
              </div>

              {/* Status Report */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs shadow-inner">
                <span className="font-semibold text-white flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Topological Healing Verification Status
                </span>
                {healingApplied && healedConnections.length > 0 ? (
                  <p className="text-slate-400 leading-relaxed">
                    Successfully healed <span className="text-emerald-400 font-bold font-mono">{healedConnections.length}</span> disjoint segment gaps satisfying physical proximity constraints (&lt;{maxHealDistance}px) and angular deviation limits (&lt;{maxAngularDeviation}°). Separate components merged via trajectory-aligned bridging.
                  </p>
                ) : (
                  <p className="text-amber-400 font-medium leading-relaxed">
                    No topological connections formed. Either healing is disabled, or none of the disjoint segment endpoints satisfy both the maximum proximity limit ({maxHealDistance}px) and maximum alignment angle ({maxAngularDeviation}°). Adjust sliders in the sidebar.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: CRITICALITY MAP & STRESS TESTING (NODE ABLATION)
            ===================================================================== */}
        {activeTab === "criticality" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Metrics column */}
            <div className="flex flex-col gap-6">
              {/* Card 1: Scorecard */}
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-white flex items-center justify-between">
                  Resilience Scorecard
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400">
                    Live Telemetry
                  </span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
                      Resilience Index
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-mono font-bold ${
                        globalResilienceIndex.R > 0.8
                          ? "text-cyan-400"
                          : globalResilienceIndex.R > 0.4
                          ? "text-amber-400"
                          : "text-red-500"
                      }`}>
                        {globalResilienceIndex.R.toFixed(3)}
                      </span>
                      <span className="text-[10px] text-slate-500">/ 1.0</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
                      Travel Delay
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-2xl font-mono font-bold ${
                        globalResilienceIndex.detourPercent > 30 ? "text-red-500" : "text-cyan-400"
                      }`}>
                        +{globalResilienceIndex.detourPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
                      Disconnected Areas
                    </span>
                    <div className="text-xl font-mono font-bold text-white">
                      {componentsCount}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
                      Ablated Nodes
                    </span>
                    <div className="text-xl font-mono font-bold text-red-400">
                      {ablatedNodes.length}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1 font-semibold text-cyan-400">
                    Representative O-D Travel Delay
                  </span>
                  <div className="flex items-baseline gap-2 mt-1 justify-between">
                    <span className={`text-2xl font-mono font-bold ${
                      representativeOdResults.increasePct > 30 ? "text-red-500" : "text-cyan-400"
                    }`}>
                      +{representativeOdResults.increasePct.toFixed(1)}%
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      +{representativeOdResults.increaseAbs.toFixed(1)}m delay
                    </span>
                  </div>
                </div>

                {ablatedNodes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 w-full mb-0.5">Currently Disabled:</span>
                    {ablatedNodes.map(nodeId => (
                      <span
                        key={nodeId}
                        onClick={() => handleNodeClick(nodeId)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 cursor-pointer transition-all"
                      >
                        Node {nodeId}
                        <span className="text-slate-600">×</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 2: Routing analysis */}
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Compass className="w-4.5 h-4.5 text-cyan-400" />
                  Routing & Path Rerouting
                </h3>

                <div className="flex flex-col gap-1.5 text-xs">
                  <span className="text-slate-400 font-medium">Visualization Target Mode</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRouteVisualizationMode("custom")}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-bold transition-all border ${
                        routeVisualizationMode === "custom"
                          ? "bg-cyan-950/60 text-cyan-400 border-cyan-800"
                          : "bg-slate-950 text-slate-400 border-slate-900 hover:text-white"
                      }`}
                    >
                      Custom O-D Pair
                    </button>
                    <select
                      value={routeVisualizationMode === "custom" ? "custom" : routeVisualizationMode}
                      onChange={(e) => {
                        setRouteVisualizationMode(e.target.value);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-all bg-slate-950 border ${
                        routeVisualizationMode !== "custom"
                          ? "border-cyan-800 text-cyan-400"
                          : "border-slate-900 text-slate-400"
                      }`}
                    >
                      <option value="custom" disabled>Select Rep. O-D...</option>
                      <option value="A-I">A ➔ I (Emergency)</option>
                      <option value="G-C">G ➔ C (Cross-town)</option>
                      <option value="B-H">B ➔ H (Industrial)</option>
                      <option value="D-F">D ➔ F (Downtown)</option>
                      <option value="A-F">A ➔ F (North-South)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-slate-400 font-medium">Origin Node</span>
                    <select
                      value={activeOrigin}
                      onChange={(e) => {
                        setRouteVisualizationMode("custom");
                        setRoutingOrigin(e.target.value);
                      }}
                      disabled={routeVisualizationMode !== "custom"}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono disabled:opacity-50"
                    >
                      {BASELINE_NODES.map(n => (
                        <option key={n.id} value={n.id} disabled={ablatedNodes.includes(n.id)}>
                          Node {n.id} ({n.id === "A" ? "North" : n.id === "I" ? "South-East" : "Hub"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-slate-400 font-medium">Destination Node</span>
                    <select
                      value={activeDestination}
                      onChange={(e) => {
                        setRouteVisualizationMode("custom");
                        setRoutingDestination(e.target.value);
                      }}
                      disabled={routeVisualizationMode !== "custom"}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono disabled:opacity-50"
                    >
                      {BASELINE_NODES.map(n => (
                        <option key={n.id} value={n.id} disabled={ablatedNodes.includes(n.id)}>
                          Node {n.id} ({n.id === "I" ? "Emergency Spot" : "Hub"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {activeRouteResult.path.length > 0 ? (
                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                      Active Shortest Corridor
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300 pt-1">
                      {activeRouteResult.path.map((node, i) => (
                        <React.Fragment key={i}>
                          <span className={`px-1.5 py-0.5 rounded font-mono font-semibold ${
                            node === activeOrigin ? "bg-cyan-950/40 text-cyan-400" : node === activeDestination ? "bg-pink-950/40 text-pink-400" : "bg-slate-800 text-white"
                          }`}>
                            {node}
                          </span>
                          {i < activeRouteResult.path.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500 border-t border-slate-900/60 pt-2 flex justify-between">
                      <span>Total path weight cost:</span>
                      <span className="font-mono text-white font-bold">{activeRouteResult.cost.toFixed(1)}m</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-950/20 rounded-lg border border-red-950 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
                    <span>No path available. The destination has been fully isolated due to ablated intersections.</span>
                  </div>
                )}
              </div>

              {/* Card 3: Representative O-D Pairs Traffic Flow Impact */}
              <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4.5 h-4.5 text-cyan-400" />
                    Representative O-D Flow Impact
                  </span>
                  {representativeOdResults.affected.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/60 border border-amber-900/50 text-amber-400">
                      {representativeOdResults.affected.length} Affected
                    </span>
                  )}
                </h3>

                <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {representativeOdResults.results.map((res, idx) => {
                    const isSelected = routeVisualizationMode === `${res.source}-${res.target}`;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setRouteVisualizationMode(isSelected ? "custom" : `${res.source}-${res.target}`)}
                        className={`p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]" 
                            : "bg-slate-950/40 hover:bg-slate-900/50 border-slate-800"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono font-bold text-slate-200">
                            Node {res.source} ➔ {res.target}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                            res.status === "Disconnected" 
                              ? "bg-red-950/50 text-red-400 border border-red-900/40" 
                              : res.status === "Detoured"
                              ? "bg-amber-950/50 text-amber-400 border border-amber-900/40"
                              : "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40"
                          }`}>
                            {res.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex flex-col gap-0.5">
                          <div className="flex justify-between">
                            <span>Baseline cost:</span>
                            <span className="text-white">{res.baseCost.toFixed(1)}m</span>
                          </div>
                          {res.status === "Detoured" && (
                            <div className="flex justify-between">
                              <span>Detour cost:</span>
                              <span className="text-amber-400 font-bold">
                                {res.pertCost.toFixed(1)}m (+{(((res.pertCost - res.baseCost)/res.baseCost)*100).toFixed(0)}%)
                              </span>
                            </div>
                          )}
                          {res.status === "Disconnected" && (
                            <div className="text-red-400 font-medium text-right mt-0.5">Route Fully Blocked</div>
                          )}
                          {res.status === "Unchanged" && (
                            <div className="text-slate-500 text-right mt-0.5">Unaffected</div>
                          )}
                        </div>
                        {res.status !== "Disconnected" && (
                          <div className="text-[9px] text-slate-500 mt-1.5 font-mono flex items-center gap-1 border-t border-slate-900/60 pt-1.5">
                            <span className="text-slate-600">Active Path:</span>
                            <span className="truncate max-w-[160px]" title={res.pertPath.join("➔")}>
                              {res.pertPath.join("➔")}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interactive Vector Map Grid */}
            <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <MapIcon className="w-4.5 h-4.5 text-cyan-400" />
                  Targeted Attack Simulator Map
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-slate-300 font-mono font-medium">🔥 Heatmap Overlay</span>
                  </label>
                  <span className="text-[10px] text-slate-400 leading-relaxed font-mono">
                    🚨 Click junctions to Toggle Ablation
                  </span>
                </div>
              </div>

              <div className="relative border border-slate-800 bg-slate-950 rounded-xl overflow-hidden aspect-video">
                <svg className="w-full h-full max-h-[380px]" viewBox="0 0 500 500">
                  {/* Grid background */}
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Draw standard centerline edges */}
                  {currentGraph.edges.map((edge, i) => {
                    const srcNode = BASELINE_NODES.find(n => n.id === edge.source)!;
                    const tgtNode = BASELINE_NODES.find(n => n.id === edge.target)!;
                    
                    // Determine if edge is part of the active shortest path
                    const pIndexS = activeRouteResult.path.indexOf(edge.source);
                    const pIndexT = activeRouteResult.path.indexOf(edge.target);
                    const isShortestRoute = pIndexS !== -1 && pIndexT !== -1 && Math.abs(pIndexS - pIndexT) === 1;

                    const key = edge.source < edge.target ? `${edge.source}-${edge.target}` : `${edge.target}-${edge.source}`;
                    const edgeCrit = betweennessCentrality.edgeCentrality[key] || 0;

                    // Heatmap coloring
                    let strokeColor = "#334155"; // Default cool dark gray
                    if (showHeatmap) {
                      if (edgeCrit > 0.25) {
                        strokeColor = "#f43f5e"; // Rose / crimson (critical weakest link)
                      } else if (edgeCrit > 0.12) {
                        strokeColor = "#f59e0b"; // Amber (high-utilization hub corridor)
                      } else if (edgeCrit > 0.03) {
                        strokeColor = "#10b981"; // Emerald green (moderate flow)
                      } else {
                        strokeColor = "#475569"; // Slate for low flow
                      }
                    } else if (isShortestRoute) {
                      strokeColor = "#06b6d4"; // Cyan start-to-end routing highlight
                    } else if (edge.isGap) {
                      strokeColor = "#22d3ee";
                    }

                    return (
                      <g key={`edge-map-group-${i}`}>
                        {/* Glowing backdrop if it's the active shortest route */}
                        {isShortestRoute && (
                          <line
                            x1={srcNode.x}
                            y1={srcNode.y}
                            x2={tgtNode.x}
                            y2={tgtNode.y}
                            stroke="#06b6d4"
                            strokeWidth={showHeatmap ? "5.5" : "4.5"}
                            opacity="0.35"
                            strokeLinecap="round"
                          />
                        )}
                        <line
                          x1={srcNode.x}
                          y1={srcNode.y}
                          x2={tgtNode.x}
                          y2={tgtNode.y}
                          stroke={strokeColor}
                          strokeWidth={isShortestRoute ? "2.5" : "2"}
                          strokeDasharray={edge.isGap ? "6, 4" : "0"}
                          opacity={isShortestRoute ? "1.0" : "0.75"}
                          className="transition-all duration-300"
                        />
                      </g>
                    );
                  })}

                  {/* Draw ablated roads as dim gray dotted lines */}
                  {BASELINE_EDGES.filter(e => ablatedNodes.includes(e.source) || ablatedNodes.includes(e.target)).map((edge, i) => {
                    const srcNode = BASELINE_NODES.find(n => n.id === edge.source)!;
                    const tgtNode = BASELINE_NODES.find(n => n.id === edge.target)!;
                    return (
                      <line
                        key={`edge-ablated-${i}`}
                        x1={srcNode.x}
                        y1={srcNode.y}
                        x2={tgtNode.x}
                        y2={tgtNode.y}
                        stroke="#1e293b"
                        strokeWidth="1.5"
                        strokeDasharray="4, 4"
                      />
                    );
                  })}

                  {/* Draw nodes with Betweenness Centrality weights */}
                  {BASELINE_NODES.map((node, i) => {
                    const isAblated = ablatedNodes.includes(node.id);
                    const centrality = betweennessCentrality.nodeCentrality[node.id] || 0;
                    
                    // Style by centrality
                    let fill = "#0ea5e9"; // standard blue
                    let radius = 6;
                    let stroke = "#0f172a";
                    
                    if (node.id === routingOrigin) {
                      fill = "#06b6d4"; // cyan start
                      radius = 9;
                    } else if (node.id === routingDestination) {
                      fill = "#ec4899"; // pink end
                      radius = 9;
                    } else if (isAblated) {
                      fill = "#ef4444"; // red ablated
                      radius = 6;
                      stroke = "#7f1d1d";
                    } else if (centrality > 0.3) {
                      fill = "#ef4444"; // high centrality red
                      radius = 8.5;
                    } else if (centrality > 0.15) {
                      fill = "#f59e0b"; // medium yellow
                      radius = 7.5;
                    }

                    return (
                      <g
                        key={`node-map-${i}`}
                        onClick={() => handleNodeClick(node.id)}
                        className="cursor-pointer group"
                      >
                        {/* Interactive glow rings */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 6}
                          fill={fill}
                          opacity={isAblated ? "0.0" : "0.08"}
                          className="group-hover:scale-125 transition-transform"
                        />
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius}
                          fill={isAblated ? "#020617" : fill}
                          stroke={isAblated ? "#ef4444" : stroke}
                          strokeWidth="2"
                          className="transition-colors"
                        />
                        {isAblated && (
                          <line
                            x1={node.x - 4}
                            y1={node.y - 4}
                            x2={node.x + 4}
                            y2={node.y + 4}
                            stroke="#ef4444"
                            strokeWidth="2"
                          />
                        )}
                        <text
                          x={node.x + 10}
                          y={node.y + 4}
                          fill={isAblated ? "#ef4444" : "#f4f4f5"}
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight={node.id === "E" ? "bold" : "normal"}
                        >
                          {node.id} {node.id === "E" ? "★" : ""}
                        </text>
                      </g>
                    );
                  })}
                </svg>

              </div>

              {/* Map Legend Panel (Moved out of map viewport to avoid unblocking node interaction) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-[10px] font-mono">
                <div>
                  <span className="font-bold text-slate-400 block pb-1.5 border-b border-slate-800/60 mb-2 uppercase tracking-widest text-[9px]">
                    Centrality Index Heatmap Key
                  </span>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white/20" />
                      <span className="text-slate-300">High Hub (Centrality &gt; 0.3)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white/20" />
                      <span className="text-slate-300">Live Hub (Centrality &gt; 0.15)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-white/20" />
                      <span className="text-slate-300">Standard Junction</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-red-500 flex items-center justify-center font-bold text-red-500 text-[8px]" style={{ width: 10, height: 10 }}>×</div>
                      <span className="text-slate-300">Ablated / Out of Service</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-400 block pb-1.5 border-b border-slate-800/60 mb-2 uppercase tracking-widest text-[9px]">
                    {showHeatmap ? '🔥 Segment Criticality (Weakest Links)' : 'Routing & Path Status'}
                  </span>
                  {showHeatmap ? (
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-1 bg-[#f43f5e] rounded" />
                        <span className="text-slate-300">Extreme Segment Criticality (&gt; 0.25)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-1 bg-[#f59e0b] rounded" />
                        <span className="text-slate-300">High Segment Centrality (&gt; 0.12)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-1 bg-[#10b981] rounded" />
                        <span className="text-slate-300">Standard Transit (&gt; 0.03)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                        <span className="text-slate-300">Active Start (Origin)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                        <span className="text-slate-300">Emergency Destination</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-1 bg-cyan-500 rounded" />
                        <span className="text-slate-300">Active Shortest Route</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Expert Advisory Panel */}
              <div className="border-t border-slate-800/60 pt-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-semibold text-white">Geospatial AI Advisory Brief</span>
                  </div>
                  <button
                    onClick={generateAIPlan}
                    disabled={aiReportLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-xs text-cyan-400 disabled:text-slate-500 hover:text-cyan-300 font-semibold transition-all border border-slate-850"
                  >
                    {aiReportLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Generating Brief...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Generate AI Mitigation Report
                      </>
                    )}
                  </button>
                </div>

                {aiReport ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs leading-relaxed max-h-[220px] overflow-y-auto font-sans prose prose-invert">
                    <div className="whitespace-pre-line text-slate-300">{aiReport}</div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 leading-relaxed italic bg-slate-950/20 p-3 rounded-lg border border-slate-900/60 text-center">
                    Click "Generate AI Mitigation Report" to consult the server-side expert Gemini advisor on strategic redundancy corridors for the active scenario.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: PYTHON CODE CENTER
            ===================================================================== */}
        {activeTab === "code" && (
          <div id="code_center" className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
            {/* Left sidebar listing files */}
            <div className="lg:col-span-1 flex flex-col gap-3.5">
              <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-1">
                  Python Target Stack
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
                  Production ready modular components for independent local deployments.
                </p>
                <div className="space-y-1.5 text-[10px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>PyTorch</span>
                    <span className="text-white">v2.1+</span>
                  </div>
                  <div className="flex justify-between">
                    <span>skimage / cv2</span>
                    <span className="text-white">Latest</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NetworkX</span>
                    <span className="text-white">v3.0+</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Streamlit</span>
                    <span className="text-white">v1.28+</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {PYTHON_FILES.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      selectedFileIndex === idx
                        ? "bg-cyan-950/15 border-cyan-500/35 text-white"
                        : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <file.icon className={`w-4 h-4 mt-0.5 shrink-0 ${selectedFileIndex === idx ? "text-cyan-400" : "text-slate-500"}`} />
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-semibold">{file.name}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{file.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Code viewer column */}
            <div className="lg:col-span-3 flex flex-col gap-3 bg-slate-900/30 border border-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4" />
                    /python_source/{PYTHON_FILES[selectedFileIndex].name}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {PYTHON_FILES[selectedFileIndex].description}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyCode(PYTHON_FILES[selectedFileIndex].code, selectedFileIndex)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
                >
                  {copiedIndex === selectedFileIndex ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Script
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex-grow">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono leading-relaxed text-slate-300 overflow-x-auto max-h-[480px] select-all">
                  <code>{PYTHON_FILES[selectedFileIndex].code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/25 py-5 px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="font-semibold text-slate-400">Route Resilience Engine</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Dual full-stack python target & real-time React simulator workspace.</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-slate-600">Local Time: 2026-06-23</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-500 font-semibold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              Express API Secure
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
