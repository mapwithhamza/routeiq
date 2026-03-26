"""
backend/dsa/dfs.py — Depth-First Search route finder (pure Python).

DFS explores as far as possible along each branch before backtracking.
It finds *a* path (not necessarily shortest), useful as a baseline
comparison against more sophisticated algorithms.

Return format mirrors all other DSA modules:
{
    "algorithm":      str,
    "route":          list[int],
    "distance":       float,   (km)
    "time":           float,   (minutes at 40 km/h)
    "nodes_explored": int,
    "runtime_ms":     float,
}
"""

import time

from dsa.graph import Graph

AVG_SPEED_KMH = 40.0


def dfs(graph: Graph, start: int, end: int) -> dict:
    """
    Iterative DFS path from *start* to *end* on *graph*.

    Uses an explicit stack to avoid Python recursion-depth limits on large
    graphs.

    Parameters
    ----------
    graph : Graph  — adjacency-list weighted graph
    start : int    — source node id
    end   : int    — destination node id

    Returns
    -------
    Standard result dict (see module docstring).
    """
    t0 = time.perf_counter()

    visited: set[int] = set()
    # Stack entries: (current_node, path_so_far)
    stack: list[tuple[int, list[int]]] = [(start, [start])]
    nodes_explored = 0
    route: list[int] = []

    while stack:
        current, path = stack.pop()
        if current in visited:
            continue
        visited.add(current)
        nodes_explored += 1

        if current == end:
            route = path
            break

        for neighbour, _ in graph.adj[current]:
            if neighbour not in visited:
                stack.append((neighbour, path + [neighbour]))

    # Compute total distance
    distance = 0.0
    for i in range(len(route) - 1):
        distance += graph.edge_weight(route[i], route[i + 1])

    runtime_ms = (time.perf_counter() - t0) * 1000

    return {
        "algorithm": "DFS",
        "route": route,
        "distance": round(distance, 4),
        "time": round((distance / AVG_SPEED_KMH) * 60, 4),
        "nodes_explored": nodes_explored,
        "runtime_ms": round(runtime_ms, 4),
    }
