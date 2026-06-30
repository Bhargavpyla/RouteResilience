import numpy as np
import cv2
import networkx as nx
from skimage.morphology import skeletonize
from skimage.measure import label
from typing import List, Tuple, Dict, Set, Any

# =====================================================================
# Phase 2: Graph Skeletonization & Topological Healing
# =====================================================================

class DisjointSetUnion:
    """
    Classic Disjoint Set Union (DSU) data structure with path compression 
    and rank-based union, optimized for topological graph healing.
    """
    def __init__(self, n: int):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, i: int) -> int:
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i]) # Path compression
        return self.parent[i]

    def union(self, i: int, j: int) -> bool:
        root_i = self.find(i)
        root_j = self.find(j)
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
    Takes a binary road segmentation mask, reduces it to a 1-pixel wide skeleton, 
    and extracts nodes (intersections/endpoints) and edges as a NetworkX graph.
    """
    # 1. Morphological skeletonization
    skeleton = skeletonize(binary_mask > 0).astype(np.uint8)
    
    # 2. Extract key points (nodes)
    h, w = skeleton.shape
    G = nx.Graph()
    
    # Kernel to count neighbors
    kernel = np.array([[1, 1, 1],
                       [1, 0, 1],
                       [1, 1, 1]], dtype=np.uint8)
    
    neighbors_count = cv2.filter2D(skeleton.astype(np.float32), -1, kernel, borderType=cv2.BORDER_CONSTANT)
    neighbors_count = neighbors_count * skeleton # only keep skeleton pixels
    
    # Nodes are endpoints (neighbors == 1) or intersections (neighbors >= 3)
    endpoints = np.argwhere(neighbors_count == 1)
    intersections = np.argwhere(neighbors_count >= 3)
    
    node_idx = 0
    node_map = {} # (r, c) -> node_id
    
    # Add endpoints and intersections to graph
    for r, c in np.vstack((endpoints, intersections)) if len(endpoints) > 0 and len(intersections) > 0 else (endpoints if len(endpoints) > 0 else intersections):
        nid = f"N_{node_idx}"
        G.add_node(nid, pos=(int(c), int(r)), type="endpoint" if neighbors_count[r, c] == 1 else "intersection")
        node_map[(r, c)] = nid
        node_idx += 1

    # 3. Edge extraction (trace skeleton between key points)
    visited = np.zeros_like(skeleton, dtype=bool)
    
    # Simple BFS helper to trace road segments between junctions
    def trace_segment(start_pt: Tuple[int, int], first_step: Tuple[int, int]) -> Tuple[Tuple[int, int], float, List[Tuple[int, int]]]:
        path = [start_pt, first_step]
        curr = first_step
        visited[curr[0], curr[1]] = True
        
        while True:
            r, c = curr
            if (r, c) in node_map and (r, c) != start_pt:
                return (r, c), float(len(path)), path
            
            # Find unvisited neighbors
            neighbors = []
            for dr in [-1, 0, 1]:
                for dc in [-1, 0, 1]:
                    if dr == 0 and dc == 0:
                        continue
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < h and 0 <= nc < w:
                        if skeleton[nr, nc] == 1 and not visited[nr, nc]:
                            neighbors.append((nr, nc))
            
            # If we hit an endpoint or dead end
            if len(neighbors) == 0:
                # Look if we are next to a known node
                for dr in [-1, 0, 1]:
                    for dc in [-1, 0, 1]:
                        nr, nc = r + dr, c + dc
                        if (nr, nc) in node_map and (nr, nc) != start_pt:
                            return (nr, nc), float(len(path) + 1), path + [(nr, nc)]
                return curr, float(len(path)), path
            
            # Continue tracing
            curr = neighbors[0]
            visited[curr[0], curr[1]] = True
            path.append(curr)

    # Initialize edge tracing from intersections/endpoints
    for (r, c), nid in list(node_map.items()):
        # Scan immediate neighbors
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                if dr == 0 and dc == 0:
                    continue
                nr, nc = r + dr, c + dc
                if 0 <= nr < h and 0 <= nc < w:
                    if skeleton[nr, nc] == 1 and not visited[nr, nc]:
                        visited[nr, nc] = True
                        end_pt, length, path = trace_segment((r, c), (nr, nc))
                        if end_pt in node_map:
                            end_nid = node_map[end_pt]
                            if nid != end_nid:
                                G.add_edge(nid, end_nid, weight=length, path=path)

    return G, skeleton


def compute_angle(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """
    Computes absolute heading angle of vector p1 -> p2 in degrees [0, 180]
    """
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    angle = np.degrees(np.arctan2(dy, dx)) % 180
    return angle


def heal_topological_gaps(
    G: nx.Graph, 
    max_dist_px: float = 40.0, 
    max_angular_diff_deg: float = 30.0
) -> Tuple[nx.Graph, List[Tuple[str, str, float]]]:
    """
    Heals disconnected road segments caused by tree canopies, shadow occlusions, or cloud cover:
    1. Identify all 'endpoint' nodes.
    2. Group endpoints into disconnected subgraphs using DSU.
    3. Evaluate pairwise candidates across different subgraphs.
    4. Calculate physical distance and heading direction alignment.
    5. Add bridging edge if both metrics fall below defined thresholds.
    """
    healed_G = G.copy()
    endpoints = [n for n, d in G.nodes(data=True) if d.get("type") == "endpoint"]
    
    if len(endpoints) < 2:
        return healed_G, []

    # Map endpoints to integers for DSU
    ep_map = {n: i for i, n in enumerate(endpoints)}
    dsu = DisjointSetUnion(len(endpoints))
    
    # Initialize DSU based on existing components in the original graph G
    subgraphs = list(nx.connected_components(G))
    for sg in subgraphs:
        sg_eps = [n for n in sg if n in ep_map]
        for i in range(len(sg_eps) - 1):
            dsu.union(ep_map[sg_eps[i]], ep_map[sg_eps[i+1]])

    healing_candidates = []

    # Pairwise comparison of endpoints across different components
    for i in range(len(endpoints)):
        for j in range(i + 1, len(endpoints)):
            u, v = endpoints[i], endpoints[j]
            
            # Only connect endpoints belonging to separate connected subgraphs
            if dsu.find(ep_map[u]) == dsu.find(ep_map[v]):
                continue

            pos_u = G.nodes[u]["pos"]
            pos_v = G.nodes[v]["pos"]
            
            # 1. Euclidean distance threshold
            dist = np.sqrt((pos_u[0] - pos_v[0])**2 + (pos_u[1] - pos_v[1])**2)
            if dist > max_dist_px:
                continue

            # 2. Angular alignment calculation
            # Trace the tangent/direction of the roads terminating at u and v
            neighbors_u = list(G.neighbors(u))
            neighbors_v = list(G.neighbors(v))
            
            if len(neighbors_u) == 0 or len(neighbors_v) == 0:
                continue
                
            # Direction vectors using the parent node connected to the endpoint
            parent_u = G.nodes[neighbors_u[0]]["pos"]
            parent_v = G.nodes[neighbors_v[0]]["pos"]
            
            heading_u = compute_angle(parent_u, pos_u)
            heading_v = compute_angle(parent_v, pos_v)
            bridge_heading = compute_angle(pos_u, pos_v)
            
            # Absolute differences to bridge heading
            diff_u = min(abs(heading_u - bridge_heading), 180 - abs(heading_u - bridge_heading))
            diff_v = min(abs(heading_v - bridge_heading), 180 - abs(heading_v - bridge_heading))
            
            # We want both roads to be directed generally towards each other
            if diff_u < max_angular_diff_deg and diff_v < max_angular_diff_deg:
                healing_candidates.append((u, v, dist))

    # Sort healing candidates by distance to solve nearest-snapping first (greedy MST approximation)
    healing_candidates.sort(key=lambda x: x[2])
    added_bridges = []

    for u, v, d in healing_candidates:
        root_u = dsu.find(ep_map[u])
        root_v = dsu.find(ep_map[v])
        
        # Ensure we don't form redundant loops with our healed lines (maintains spanning property)
        if root_u != root_v:
            dsu.union(ep_map[u], ep_map[v])
            healed_G.add_edge(u, v, weight=d, healed=True, path=[healed_G.nodes[u]["pos"], healed_G.nodes[v]["pos"]])
            added_bridges.append((u, v, d))
            
            # Change node types from endpoint to segment junctions
            healed_G.nodes[u]["type"] = "healed_junction"
            healed_G.nodes[v]["type"] = "healed_junction"

    return healed_G, added_bridges


if __name__ == "__main__":
    # Standard script verify
    print("[Graph Processing] Testing centerlines & skeleton healing...")
    
    # Create synthetic binary road mask with a cloud gap
    mock_mask = np.zeros((100, 100), dtype=np.uint8)
    mock_mask[10:40, 50:54] = 255 # Segment 1
    # GAP of 20 pixels between rows 40 and 60
    mock_mask[60:90, 50:54] = 255 # Segment 2
    
    # Extract centerline skeleton and nodes
    G, skeleton = extract_centerline_graph(mock_mask)
    print(f"Nodes found: {len(G.nodes)} | Edges found: {len(G.edges)}")
    
    # Run Topological Healing
    healed_G, bridges = heal_topological_gaps(G, max_dist_px=30.0, max_angular_diff_deg=20.0)
    print(f"Topological Healing added {len(bridges)} bridges.")
    for u, v, dist in bridges:
        print(f"  Healed bridge: {u} <---> {v} over {dist:.1f} pixels.")
