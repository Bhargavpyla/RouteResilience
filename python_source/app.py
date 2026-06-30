import streamlit as st
import numpy as np
import cv2
import networkx as nx
import folium
from streamlit_folium import st_folium
import json

# Import custom modules
import graph_processing as gp
import analysis as ga
import utils as gu

# =====================================================================
# Phase 4: Interactive Dashboard (Streamlit & Folium)
# =====================================================================

st.set_page_config(
    page_title="Route Resilience Analyzer",
    page_icon="🗺️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize Session State variables if not already set
if "baseline_graph" not in st.session_state:
    # Build a beautiful default mock graph representing an urban district 
    # consisting of major loops, bridges, and dead-ends with gaps
    G = nx.Graph()
    # Coordinates in pixel grid (500x500)
    nodes_data = {
        "A": ((100, 100), "intersection"),
        "B": ((220, 90), "intersection"),
        "C": ((380, 110), "intersection"),
        "D": ((120, 240), "intersection"),
        "E": ((250, 260), "intersection"), # Gatekeeper bottleneck node
        "F": ((410, 250), "intersection"),
        "G": ((110, 390), "intersection"),
        "H": ((240, 420), "intersection"),
        "I": ((390, 400), "intersection"),
        # Endpoint nodes creating occluded gaps
        "Gap1_L": ((180, 180), "endpoint"), # Broken road segment gap 1 Left
        "Gap1_R": ((210, 182), "endpoint"), # Gap 1 Right
        "Gap2_L": ((280, 330), "endpoint"), # Gap 2 Left
        "Gap2_R": ((310, 333), "endpoint"), # Gap 2 Right
    }
    for k, (pos, ntype) in nodes_data.items():
        G.add_node(k, pos=pos, type=ntype)
        
    edges_data = [
        ("A", "B", 120), ("B", "C", 160),
        ("A", "D", 140), ("D", "G", 150),
        ("C", "F", 145), ("F", "I", 150),
        ("G", "H", 130), ("H", "I", 155),
        # Junction to gap terminals (under tree canopies)
        ("A", "Gap1_L", 110), ("B", "Gap1_R", 40),
        ("H", "Gap2_L", 100), ("I", "Gap2_R", 110),
        # Transit center linking East and West
        ("D", "E", 130), ("E", "F", 160),
        ("E", "H", 160)
    ]
    for u, v, w in edges_data:
        G.add_edge(u, v, weight=w)
        
    st.session_state.baseline_graph = G
    st.session_state.ablated_nodes = []
    st.session_state.origin_node = "A"
    st.session_state.dest_node = "I"

# Geographic bounding box for folium rendering (centered on an urban grid)
MAP_BBOX = (37.7749, -122.4194, 37.7849, -122.4094) # San Francisco Area
MAP_SHAPE = (500, 500)

st.title("🗺️ Route Resilience: Occlusion-Robust Road Extraction & Criticality Analysis")
st.markdown("""
Extract road networks from high-resolution satellite tiles, bridge logical gaps caused by cloud shadows and tree canopy occlusions 
using Graph-Theoretic MST Healing, and stress test network integrity under targeted ablatative node failures.
""")

# ---------------------------------------------------------------------
# Sidebar Configuration Panel
# ---------------------------------------------------------------------
st.sidebar.header("⚙️ Pipeline Configurations")

# Section 1: U-Net Segmentation Parameters
st.sidebar.subheader("1. Deep Learning Segmentation")
bin_threshold = st.sidebar.slider("Binarization Confidence Threshold", 0.1, 0.9, 0.5, step=0.05)
boundary_weight = st.sidebar.slider("Boundary Loss Weight (β)", 0.0, 1.0, 0.2, step=0.05)

# Section 2: Topological Healing Thresholds
st.sidebar.subheader("2. Topological Graph Healing")
max_heal_dist = st.sidebar.slider("Max Healing Distance (px)", 10, 100, 45, step=5)
max_heal_angle = st.sidebar.slider("Max Angular Deviation (deg)", 5, 60, 25, step=5)

# Reset Button
if st.sidebar.button("🔄 Reset Ablated Network"):
    st.session_state.ablated_nodes = []
    st.rerun()

# ---------------------------------------------------------------------
# Main Interface Tabs
# ---------------------------------------------------------------------
tab_seg, tab_heal, tab_resilience = st.tabs([
    "📸 Phase 1: Segmentation Pipeline",
    "🩺 Phase 2: Centerline Graph & Healing",
    "⚡ Phase 3-4: Network Criticality & Stress Testing"
])

# ---------------------------------------------------------------------
# Tab 1: Occlusion-Robust Segmentation
# ---------------------------------------------------------------------
with tab_seg:
    st.header("📸 Deep Learning Road Extraction under Occlusions")
    st.write("""
    Simulate a convolutional road extraction pipeline on satellite imagery experiencing high tree canopy and cloud occlusions. 
    Adjusting confidence thresholds dynamically shapes the binary road masks before morphological skeletonization is applied.
    """)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.subheader("1. Input Satellite + Occlusions")
        # Generates a simple visual grid representing a satellite map with occlusions
        mock_sat = np.ones((300, 300, 3), dtype=np.uint8) * 120
        # Draw roads
        cv2.line(mock_sat, (50, 0), (50, 300), (220, 220, 220), 10)
        cv2.line(mock_sat, (0, 150), (300, 150), (220, 220, 220), 10)
        # Add a cloud occlusion
        cv2.circle(mock_sat, (50, 120), 40, (250, 250, 250), -1) # cloud blocks intersection
        cv2.circle(mock_sat, (200, 150), 30, (34, 139, 34), -1) # canopy blocks road
        st.image(mock_sat, caption="Occluded Satellite Imagery (Simulated)", use_container_width=True)
        
    with col2:
        st.subheader("2. Raw U-Net Probabilities")
        # Raw prediction logits output
        mock_pred = np.zeros((300, 300), dtype=np.uint8)
        cv2.line(mock_pred, (50, 0), (50, 300), 200, 10)
        cv2.line(mock_pred, (0, 150), (300, 150), 200, 10)
        # Cloud and tree canopy reduce confidence to near 0
        cv2.circle(mock_pred, (50, 120), 40, 20, -1)
        cv2.circle(mock_pred, (200, 150), 30, 10, -1)
        # Display as a probability heatmap
        heatmap = cv2.applyColorMap(mock_pred, cv2.COLORMAP_VIRIDIS)
        st.image(heatmap, caption="U-Net Raw Segment Probability", use_container_width=True)
        
    with col3:
        st.subheader("3. Binarized Mask (Thresholded)")
        # Binarized using slider value
        val_scaled = int(bin_threshold * 255)
        _, mock_bin = cv2.threshold(mock_pred, val_scaled, 255, cv2.THRESH_BINARY)
        st.image(mock_bin, caption=f"Binary Road Mask (Threshold: {bin_threshold})", use_container_width=True)

# ---------------------------------------------------------------------
# Tab 2: Skeletonization & Topological Healing
# ---------------------------------------------------------------------
with tab_heal:
    st.header("🩺 Centerline Extraction & Graph Healing")
    st.write("""
    Applying morphological skeletonization yields a 1-pixel wide centerline network. Disjoint-Set Union (DSU) and 
    angular alignment tracing bridge the broken corridors (gaps) to heal topological connectedness.
    """)
    
    col_g1, col_g2 = st.columns([1, 1])
    
    # Run Topological Healing using thresholds
    G_baseline = st.session_state.baseline_graph
    healed_G, added_bridges = gp.heal_topological_gaps(
        G_baseline, 
        max_dist_px=max_heal_dist, 
        max_angular_diff_deg=max_heal_angle
    )
    
    with col_g1:
        st.subheader("Broken Skeleton Network (Before Healing)")
        st.write("Contains separate disconnected subgraphs due to tree and shadow occlusions.")
        
        # Display original components info
        comps_before = nx.number_connected_components(G_baseline)
        st.metric("Disconnected Subgraph Count", comps_before, delta="- Gaps Broken")
        
        # Summary of broken gaps
        st.write("🔴 **Identified Occluded Endpoints:**")
        eps = [n for n, d in G_baseline.nodes(data=True) if d.get("type") == "endpoint"]
        st.info(f"Detected endpoints waiting for validation: {', '.join(eps)}")
        
    with col_g2:
        st.subheader("Healed Network (After MST & Angular Healing)")
        st.write("Gaps are dynamically resolved using distance constraints and angular matching.")
        
        comps_after = nx.number_connected_components(healed_G)
        st.metric("Healed Connected Components", comps_after, delta=f"{comps_before - comps_after} Bridges Restored", delta_color="inverse")
        
        if len(added_bridges) > 0:
            st.write("🟢 **Successfully Restored Corridors:**")
            for u, v, dist in added_bridges:
                st.success(f"Bridge established: {u} ↔️ {v} (Distance: {dist:.1f}px, Heading: Parallel)")
        else:
            st.warning("No gaps bridged. Try increasing 'Max Healing Distance' or 'Max Angular Deviation' in the sidebar.")

# ---------------------------------------------------------------------
# Tab 3: Resilience Map & Stress Testing
# ---------------------------------------------------------------------
with tab_resilience:
    st.header("⚡ Urban Resilience & Targeted Attack Stress Testing")
    st.write("""
    Every node is weighted by its **Betweenness Centrality (Criticality Worth)**. Select critical junctions to systematically "ablate" 
    them (simulate floods, infrastructure blockages, or closures) and see real-time rerouting behavior.
    """)
    
    # Compute centralities on the healed graph
    centrality_dict = ga.calculate_gatekeeper_nodes(healed_G)
    
    # Simulate ablation
    perturbed_G = ga.simulate_node_ablation(healed_G, st.session_state.ablated_nodes)
    
    # Calculate global resilience
    R, travel_time_change = ga.calculate_resilience_index(healed_G, perturbed_G)
    
    # Representative O-D Pairs dynamic traffic simulation
    representative_od_pairs = [
        ("A", "I"), # North-West to South-East
        ("G", "C"), # South-West to North-East
        ("B", "H"), # North to South
        ("D", "F"), # West to East
        ("A", "F"), # North-West to East
    ]
    
    affected_pairs = []
    total_baseline_time_for_affected = 0.0
    total_perturbed_time_for_affected = 0.0
    num_disconnected_affected = 0
    
    for src, dst in representative_od_pairs:
        base_path, base_cost = ga.find_alternative_route(healed_G, src, dst)
        pert_path, pert_cost = ga.find_alternative_route(perturbed_G, src, dst)
        
        if base_cost == float('inf'):
            continue
            
        # A route is affected if it contained an ablated node, or its cost increased, or it got disconnected
        is_affected = (
            any(n in st.session_state.ablated_nodes for n in base_path) or
            pert_cost > base_cost or
            pert_cost == float('inf')
        )
        
        if is_affected:
            affected_pairs.append({
                "pair": f"{src} ➔ {dst}",
                "src": src,
                "dst": dst,
                "base_path": base_path,
                "base_cost": base_cost,
                "pert_path": pert_path,
                "pert_cost": pert_cost,
                "status": "Detoured" if pert_cost < float('inf') else "Disconnected"
            })
            total_baseline_time_for_affected += base_cost
            if pert_cost == float('inf'):
                num_disconnected_affected += 1
                total_perturbed_time_for_affected += (base_cost * 3.0) # Penalty for disconnection
            else:
                total_perturbed_time_for_affected += pert_cost
                
    if len(affected_pairs) > 0:
        avg_affected_increase_pct = ((total_perturbed_time_for_affected - total_baseline_time_for_affected) / total_baseline_time_for_affected) * 100.0
        avg_affected_increase_abs = total_perturbed_time_for_affected - total_baseline_time_for_affected
    else:
        avg_affected_increase_pct = 0.0
        avg_affected_increase_abs = 0.0

    # Layout with Stats on left, Map on right
    col_map_stats, col_map_disp = st.columns([1, 2])
    
    with col_map_stats:
        st.subheader("📊 Resilience Scorecard")
        
        # Resilience score display
        r_color = "normal" if R > 0.8 else ("off" if R > 0.5 else "inverse")
        st.metric(
            label="Resilience Index (R)",
            value=f"{R:.3f}",
            delta="- Optimal 1.0" if R < 1.0 else "Fully Resilient",
            delta_color="normal" if R >= 1.0 else "inverse"
        )
        
        st.metric(
            label="Avg Shortest Path Detour Factor",
            value=f"+{travel_time_change:.1f}%",
            delta="Travel Time Delay" if travel_time_change > 0 else "No Delay",
            delta_color="inverse" if travel_time_change > 0 else "normal"
        )

        st.metric(
            label="Affected O-D Travel Time Increase",
            value=f"+{avg_affected_increase_pct:.1f}%" if len(affected_pairs) > 0 else "0.0%",
            delta=f"+{avg_affected_increase_abs:.1f}m (Penalized)" if avg_affected_increase_abs > 0 else "No Delay",
            delta_color="inverse" if avg_affected_increase_abs > 0 else "normal"
        )
        
        # Ablated node controls
        st.subheader("🚨 Node Ablation Controls")
        # List of candidate nodes sorted by betweenness centrality
        candidate_nodes = sorted(list(healed_G.nodes), key=lambda x: centrality_dict.get(x, 0.0), reverse=True)
        
        selected_ablate = st.multiselect(
            "Ablated / Disabled Junctions",
            options=candidate_nodes,
            default=st.session_state.ablated_nodes,
            help="Simulate the destruction or closure of these road intersections"
        )
        
        if selected_ablate != st.session_state.ablated_nodes:
            st.session_state.ablated_nodes = selected_ablate
            st.rerun()

        # Origin Destination analysis
        st.subheader("📍 Routing Detour Analysis")
        
        # O-D selection options: custom or representative
        route_mode = st.radio(
            "Select Route to Visualize on Map",
            options=["Custom (User-Defined)", "Representative A ➔ I", "Representative G ➔ C", "Representative B ➔ H", "Representative D ➔ F", "Representative A ➔ F"],
            index=0
        )
        
        if route_mode == "Custom (User-Defined)":
            o_col, d_col = st.columns(2)
            with o_col:
                st.session_state.origin_node = st.selectbox("Origin", options=list(healed_G.nodes), index=0)
            with d_col:
                st.session_state.dest_node = st.selectbox("Destination", options=list(healed_G.nodes), index=8)
            orig = st.session_state.origin_node
            dest = st.session_state.dest_node
        else:
            # Map representative options
            rep_mapping = {
                "Representative A ➔ I": ("A", "I"),
                "Representative G ➔ C": ("G", "C"),
                "Representative B ➔ H": ("B", "H"),
                "Representative D ➔ F": ("D", "F"),
                "Representative A ➔ F": ("A", "F"),
            }
            orig, dest = rep_mapping[route_mode]
            st.write(f"Selected: **{orig} ➔ {dest}**")
            
        # Calculate routes
        path_base, cost_base = ga.find_alternative_route(healed_G, orig, dest)
        path_pert, cost_pert = ga.find_alternative_route(perturbed_G, orig, dest)
        
        if cost_pert == float('inf'):
            st.error("❌ Destination Isolated! No alternative path exists.")
        elif orig != dest:
            st.success(f"Baseline distance: {cost_base:.1f}m | Perturbed detour: {cost_pert:.1f}m")
            detour_pct = ((cost_pert - cost_base) / cost_base) * 100.0 if cost_base > 0 else 0.0
            st.write(f"Rerouted Path Detour Impact: **+{detour_pct:.1f}%**")
            st.write(f"↪️ **New Path Node Sequence:** {' ➔ '.join(path_pert)}")

        if len(affected_pairs) > 0:
            st.write("🚦 **Representative O-D Pairs Traffic Flow Impact:**")
            for item in affected_pairs:
                status_emoji = "🟠 Detoured" if item["status"] == "Detoured" else "🔴 Disconnected (Severe)"
                cost_diff = item["pert_cost"] - item["base_cost"] if item["status"] == "Detoured" else item["base_cost"] * 2.0
                st.markdown(f"**Pair {item['pair']}**: {status_emoji}")
                st.markdown(f"- Baseline: {item['base_cost']:.1f}m (`{'➔'.join(item['base_path'])}`)")
                if item["status"] == "Detoured":
                    st.markdown(f"- Detour: {item['pert_cost']:.1f}m (+{cost_diff:.1f}m, +{(cost_diff/item['base_cost'])*100:.1f}%)")
                else:
                    st.markdown(f"- **No alternative route available!** (Isolated Component)")
            
    with col_map_disp:
        st.subheader("🗺️ Live Criticality Heatmap Map")
        st.write("Junctions colored by **Centrality Worth** (Yellow = Low, Red = High Gatekeeper). Gray dotted lines are ablated components.")
        
        # 1. Coordinate Center
        lat_c, lon_c = gu.compute_bounding_box_center(MAP_BBOX)
        m = folium.Map(location=[lat_c, lon_c], zoom_start=16, tiles="cartodbpositron")
        
        # 2. Add edges to Leaflet Map
        for u, v, data in healed_G.edges(data=True):
            # Check if edge is ablated
            is_ablated = u in st.session_state.ablated_nodes or v in st.session_state.ablated_nodes
            
            pos_u = healed_G.nodes[u]["pos"]
            pos_v = healed_G.nodes[v]["pos"]
            
            lat_u, lon_u = gu.pixel_to_coords(pos_u[0], pos_u[1], MAP_SHAPE, MAP_BBOX)
            lat_v, lon_v = gu.pixel_to_coords(pos_v[0], pos_v[1], MAP_SHAPE, MAP_BBOX)
            
            # Draw route lines
            if is_ablated:
                folium.PolyLine(
                    locations=[[lat_u, lon_u], [lat_v, lon_v]],
                    color="#999999",
                    weight=3,
                    dash_array="5, 10",
                    opacity=0.6,
                    popup="Ablated Segment"
                ).add_to(m)
            elif data.get("healed"):
                folium.PolyLine(
                    locations=[[lat_u, lon_u], [lat_v, lon_v]],
                    color="#10B981", # Green for healed
                    weight=5,
                    opacity=0.9,
                    dash_array="8, 8",
                    popup="Topologically Healed Road Bridge"
                ).add_to(m)
            else:
                folium.PolyLine(
                    locations=[[lat_u, lon_u], [lat_v, lon_v]],
                    color="#4B5563",
                    weight=4,
                    opacity=0.8,
                    popup="Standard Segment"
                ).add_to(m)
                
        # 3. Highlight the active shortest route path
        if len(path_pert) > 1:
            route_coords = []
            for node in path_pert:
                pos = healed_G.nodes[node]["pos"]
                lat, lon = gu.pixel_to_coords(pos[0], pos[1], MAP_SHAPE, MAP_BBOX)
                route_coords.append([lat, lon])
            folium.PolyLine(
                locations=route_coords,
                color="#3B82F6", # Bright blue for active detour
                weight=6,
                opacity=1.0,
                popup="Active Rerouted Corridor"
            ).add_to(m)

        # 4. Add Node Markers colored by Centrality
        for node, data in healed_G.nodes(data=True):
            pos = data["pos"]
            lat, lon = gu.pixel_to_coords(pos[0], pos[1], MAP_SHAPE, MAP_BBOX)
            cent = centrality_dict.get(node, 0.0)
            
            # Base color by centrality
            if node in st.session_state.ablated_nodes:
                color = "#000000" # Black for destroyed
                radius = 8
                fill_color = "#374151"
            elif cent > 0.4:
                color = "#DC2626" # Deep red for high centrality
                radius = 12
                fill_color = "#F87171"
            elif cent > 0.15:
                color = "#D97706" # Orange for medium centrality
                radius = 10
                fill_color = "#FBBF24"
            else:
                color = "#2563EB" # Blue for low centrality
                radius = 7
                fill_color = "#93C5FD"
                
            # If origin or destination, make distinct
            if node == orig:
                color = "#10B981"
                radius = 14
                fill_color = "#6EE7B7"
                tooltip = f"START (Origin): Node {node}"
            elif node == dest:
                color = "#EC4899"
                radius = 14
                fill_color = "#FBCFE8"
                tooltip = f"END (Destination): Node {node}"
            else:
                tooltip = f"Junction {node} (Centrality: {cent:.3f})"
                
            folium.CircleMarker(
                location=[lat, lon],
                radius=radius,
                color=color,
                fill=True,
                fill_color=fill_color,
                fill_opacity=0.8,
                tooltip=tooltip,
                popup=tooltip
            ).add_to(m)

        # Render the Leaflet map with streamlit-folium
        st_folium(m, width=800, height=450, returned_objects=[])

st.sidebar.markdown("---")
st.sidebar.info("Designed and compiled for Route Resilience Optimization Systems. © 2026.")
