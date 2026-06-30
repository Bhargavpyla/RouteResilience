import numpy as np
import networkx as nx
from typing import Dict, List, Tuple, Any

# =====================================================================
# Geospatial Helpers & Vector/Raster Conversions
# =====================================================================

def pixel_to_coords(
    pixel_x: float, 
    pixel_y: float, 
    img_shape: Tuple[int, int], 
    bbox: Tuple[float, float, float, float]
) -> Tuple[float, float]:
    """
    Converts image pixel coordinates (x, y) to geographic coordinates (lat, lon) 
    using linear interpolation within a defined bounding box:
    bbox = (min_lat, min_lon, max_lat, max_lon)
    """
    h, w = img_shape[:2]
    min_lat, min_lon, max_lat, max_lon = bbox
    
    # Calculate scale factors
    lon = min_lon + (pixel_x / w) * (max_lon - min_lon)
    lat = max_lat - (pixel_y / h) * (max_lat - min_lat) # Image y-axis is inverted
    
    return float(lat), float(lon)


def convert_networkx_to_geojson(
    G: nx.Graph, 
    img_shape: Tuple[int, int], 
    bbox: Tuple[float, float, float, float],
    centrality: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Converts a NetworkX graph with pos=(x, y) attributes into a geojson dictionary 
    for interactive visualization in web mappers (Leaflet / folium).
    """
    features = []
    
    # Add nodes as GeoJSON points
    for node, data in G.nodes(data=True):
        if "pos" not in data:
            continue
        x, y = data["pos"]
        lat, lon = pixel_to_coords(x, y, img_shape, bbox)
        
        node_cent = centrality.get(node, 0.0) if centrality else 0.0
        
        features.append({
            "type": "Feature",
            "id": node,
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "id": node,
                "type": data.get("type", "junction"),
                "centrality": float(node_cent),
                "label": f"Node {node} (Centrality: {node_cent:.4f})"
            }
        })
        
    # Add edges as GeoJSON LineStrings
    for u, v, data in G.edges(data=True):
        pos_u = G.nodes[u]["pos"]
        pos_v = G.nodes[v]["pos"]
        
        # If we have an exact centerline trace path (pixel-by-pixel), use it!
        path_pixels = data.get("path", [pos_u, pos_v])
        coordinates = []
        for px, py in path_pixels:
            lat, lon = pixel_to_coords(px, py, img_shape, bbox)
            coordinates.append([lon, lat])
            
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates
            },
            "properties": {
                "source": u,
                "target": v,
                "weight": float(data.get("weight", 1.0)),
                "healed": bool(data.get("healed", False)),
                "color": "#FF4444" if data.get("healed") else "#3388FF"
            }
        })
        
    return {
        "type": "FeatureCollection",
        "features": features
    }


def compute_bounding_box_center(bbox: Tuple[float, float, float, float]) -> Tuple[float, float]:
    """
    Returns the lat/lon centroid of a bounding box.
    """
    min_lat, min_lon, max_lat, max_lon = bbox
    return (min_lat + max_lat) / 2.0, (min_lon + max_lon) / 2.0
