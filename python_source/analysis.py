import networkx as nx
from typing import Dict, List, Tuple, Any

# =====================================================================
# Phase 3: Network Analysis & Stress Testing (NetworkX)
# =====================================================================

def calculate_gatekeeper_nodes(G: nx.Graph) -> Dict[str, float]:
    """
    Computes betweenness centrality for all nodes in the healed network 
    to pinpoint vital "Gatekeeper Nodes" (critical transit bottlenecks).
    """
    # Use network weight as cost for shortest path computation
    centrality = nx.betweenness_centrality(G, weight="weight", normalized=True)
    return centrality


def simulate_node_ablation(
    G: nx.Graph, 
    ablate_nodes: List[str]
) -> Tuple[nx.Graph, float]:
    """
    Ablates (removes) a list of nodes from the graph to simulate infrastructure failures 
    or urban closures, and returns the perturbed network state.
    """
    perturbed_G = G.copy()
    perturbed_G.remove_nodes_from(ablate_nodes)
    return perturbed_G


def calculate_resilience_index(
    baseline_G: nx.Graph, 
    perturbed_G: nx.Graph
) -> Tuple[float, float]:
    """
    Calculates the Resilience Index (R) of the network after node ablation:
    - R = (Avg Shortest Path Baseline) / (Avg Shortest Path Perturbed)
    - If R = 1.0, network is perfectly resilient (detours are instantaneous).
    - If R -> 0.0, network connectivity is heavily degraded or fragmented.
    
    Returns:
    - Resilience Index (R)
    - Travel Time/Distance Increase Factor (%)
    """
    # Average shortest path lengths for connected components
    def get_avg_shortest_path(graph: nx.Graph) -> float:
        # If the graph is disconnected, we compute the average shortest paths 
        # across all connected component subgraphs, heavily penalizing disconnected pairs.
        components = list(nx.connected_components(graph))
        total_pairs = 0
        sum_shortest_paths = 0.0
        
        for component in components:
            if len(component) < 2:
                continue
            sub_g = graph.subgraph(component)
            # Compute all-pairs shortest paths
            path_lengths = dict(nx.all_pairs_dijkstra_path_length(sub_g, weight="weight"))
            
            for src, targets in path_lengths.items():
                for dest, dist in targets.items():
                    if src != dest:
                        sum_shortest_paths += dist
                        total_pairs += 1
                        
        if total_pairs == 0:
            return float('inf')
            
        avg_path = sum_shortest_paths / total_pairs
        
        # Add a penalty multiplier for disconnected subgraphs (isolated island penalty)
        num_components = len(components)
        if num_components > 1:
            avg_path *= (1.0 + 0.15 * (num_components - 1))
            
        return avg_path

    baseline_avg = get_avg_shortest_path(baseline_G)
    perturbed_avg = get_avg_shortest_path(perturbed_G)
    
    if perturbed_avg == float('inf'):
        return 0.0, 999.0 # Entirely fragmented network
        
    if baseline_avg == 0:
        return 1.0, 0.0

    # R = Baseline Avg / Perturbed Avg (always <= 1.0)
    R = baseline_avg / perturbed_avg
    R = max(0.0, min(1.0, R))
    
    # Global travel time increase percentage
    travel_time_increase = ((perturbed_avg - baseline_avg) / baseline_avg) * 100.0
    
    return float(R), float(travel_time_increase)


def find_alternative_route(
    G: nx.Graph, 
    origin: str, 
    destination: str,
    weight: str = "weight"
) -> Tuple[List[str], float]:
    """
    Computes shortest path between a specific origin-destination pair in the network.
    Returns the node sequence list and total travel distance/time.
    """
    try:
        path = nx.shortest_path(G, source=origin, target=destination, weight=weight)
        cost = nx.shortest_path_length(G, source=origin, target=destination, weight=weight)
        return path, float(cost)
    except nx.NetworkXNoPath:
        return [], float('inf')
