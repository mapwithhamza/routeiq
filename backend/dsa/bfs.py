"""
backend/dsa/bfs.py — Breadth-First Search route finder (pure Python).

BFS explores the graph level-by-level, finding the path with the fewest
hops (not necessarily the shortest by distance).

Return format (all algorithms use this same dict):
{
    "algorithm":      str,
    "route":          list[int],   — ordered node IDs in the path
    "distance":       float,       — total route distance in km
    "time":           float,       — estimated travel time in minutes (avg 40 km/h)
    "nodes_explored": int,
    "runtime_ms":     float,
}
"""

import time
from collections import deque

from dsa.graph import Graph

AVG_SPEED_KMH = 40.0  # assumed average urban delivery speed


def bfs(graph: Graph, start: int, end: int) -> dict:
    """
    BFS shortest-hop path from *start* to *end* on *graph*.

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
    parent: dict[int, int | None] = {start: None}
    queue: deque[int] = deque([start])
    visited.add(start)
    nodes_explored = 0

    found = False
    while queue:
        current = queue.popleft()
        nodes_explored += 1
        if current == end:
            found = True
            break
        for neighbour, _ in graph.adj[current]:
            if neighbour not in visited:
                visited.add(neighbour)
                parent[neighbour] = current
                queue.append(neighbour)

    # Reconstruct path
    route: list[int] = []
    if found:
        node = end
        while node is not None:
            route.append(node)
            node = parent[node]
        route.reverse()

    # Compute total distance along reconstructed path
    distance = 0.0
    for i in range(len(route) - 1):
        distance += graph.edge_weight(route[i], route[i + 1])

    runtime_ms = (time.perf_counter() - t0) * 1000

    return {
        "algorithm": "BFS",
        "route": route,
        "distance": round(distance, 4),
        "time": round((distance / AVG_SPEED_KMH) * 60, 4),
        "nodes_explored": nodes_explored,
        "runtime_ms": round(runtime_ms, 4),
    }
