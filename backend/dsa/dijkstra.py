"""
backend/dsa/dijkstra.py — Dijkstra's shortest-path algorithm (pure Python).

Uses a binary min-heap (Python's heapq) instead of any library graph.
Finds the shortest-distance path between two nodes.

Time complexity: O((V + E) log V)

Return format:
{
    "algorithm":      "Dijkstra",
    "route":          list[int],
    "distance":       float,   (km)
    "time":           float,   (minutes at 40 km/h)
    "nodes_explored": int,
    "runtime_ms":     float,
}
"""

import heapq
import time
from math import inf

from dsa.graph import Graph

AVG_SPEED_KMH = 40.0


def dijkstra(graph: Graph, start: int, end: int) -> dict:
    """
    Dijkstra's algorithm — single-source shortest path from *start* to *end*.

    Parameters
    ----------
    graph : Graph  — adjacency-list weighted graph
    start : int    — source node id
    end   : int    — destination node id

    Returns
    -------
    Standard result dict.
    """
    t0 = time.perf_counter()

    dist: dict[int, float] = {node: inf for node in graph.nodes}
    dist[start] = 0.0
    prev: dict[int, int | None] = {node: None for node in graph.nodes}

    # Min-heap: (distance, node)
    heap: list[tuple[float, int]] = [(0.0, start)]
    visited: set[int] = set()
    nodes_explored = 0

    while heap:
        current_dist, current = heapq.heappop(heap)
        if current in visited:
            continue
        visited.add(current)
        nodes_explored += 1

        if current == end:
            break

        for neighbour, weight in graph.adj[current]:
            if neighbour in visited:
                continue
            tentative = current_dist + weight
            if tentative < dist[neighbour]:
                dist[neighbour] = tentative
                prev[neighbour] = current
                heapq.heappush(heap, (tentative, neighbour))

    # Reconstruct path
    route: list[int] = []
    if dist[end] < inf:
        node: int | None = end
        while node is not None:
            route.append(node)
            node = prev[node]
        route.reverse()

    distance = dist[end] if dist[end] < inf else 0.0
    runtime_ms = (time.perf_counter() - t0) * 1000

    return {
        "algorithm": "Dijkstra",
        "route": route,
        "distance": round(distance, 4),
        "time": round((distance / AVG_SPEED_KMH) * 60, 4),
        "nodes_explored": nodes_explored,
        "runtime_ms": round(runtime_ms, 4),
    }
