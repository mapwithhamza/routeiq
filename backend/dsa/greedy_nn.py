"""
backend/dsa/greedy_nn.py — Nearest-Neighbour Greedy TSP heuristic (pure Python).

Constructs a tour by always moving to the closest unvisited node.
Fast (O(n²)) but not optimal.  Useful as a quick upper-bound on tour length.

Return format:
{
    "algorithm":      "Greedy-NN",
    "route":          list[int],   — full tour including return to start
    "distance":       float,   (km)
    "time":           float,   (minutes at 40 km/h)
    "nodes_explored": int,
    "runtime_ms":     float,
}
"""

import time
from math import inf

from dsa.graph import Graph

AVG_SPEED_KMH = 40.0


def greedy_nn(graph: Graph, start: int = 0) -> dict:
    """
    Nearest-Neighbour Greedy TSP tour starting from *start*.

    Visits all nodes in *graph.nodes*, returning to *start* at the end.

    Parameters
    ----------
    graph : Graph  — complete weighted graph (all nodes reachable from each other)
    start : int    — starting depot node id (default 0)

    Returns
    -------
    Standard result dict. Route includes the return leg (last node == start).
    """
    t0 = time.perf_counter()

    unvisited: set[int] = set(graph.nodes)
    route: list[int] = [start]
    unvisited.discard(start)
    current = start
    total_distance = 0.0
    nodes_explored = 0

    while unvisited:
        best_dist = inf
        best_node = -1
        for node in unvisited:
            nodes_explored += 1
            d = graph.distance(current, node)
            if d < best_dist:
                best_dist = d
                best_node = node

        route.append(best_node)
        total_distance += best_dist
        unvisited.discard(best_node)
        current = best_node

    # Return to depot
    return_dist = graph.distance(current, start)
    total_distance += return_dist
    route.append(start)

    runtime_ms = (time.perf_counter() - t0) * 1000

    return {
        "algorithm": "Greedy-NN",
        "route": route,
        "distance": round(total_distance, 4),
        "time": round((total_distance / AVG_SPEED_KMH) * 60, 4),
        "nodes_explored": nodes_explored,
        "runtime_ms": round(runtime_ms, 4),
    }
