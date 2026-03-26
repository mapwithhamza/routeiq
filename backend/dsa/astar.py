"""
backend/dsa/astar.py — A* shortest-path algorithm (pure Python).

A* extends Dijkstra by using a heuristic h(n) to guide the search toward
the goal.  For geographic graphs we use the Haversine distance to the
goal as an *admissible* heuristic (never over-estimates real road distance).

Time complexity: O(E log V) in the best case; degrades to Dijkstra when
the heuristic provides no information.

Return format:
{
    "algorithm":      "A*",
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


def astar(graph: Graph, start: int, end: int) -> dict:
    """
    A* shortest path from *start* to *end*.

    Heuristic: Haversine distance from current node to *end* (km).

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

    def h(node: int) -> float:
        """Admissible heuristic — straight-line Haversine distance to goal."""
        return graph.distance(node, end)

    g_score: dict[int, float] = {node: inf for node in graph.nodes}
    g_score[start] = 0.0

    f_score: dict[int, float] = {node: inf for node in graph.nodes}
    f_score[start] = h(start)

    prev: dict[int, int | None] = {node: None for node in graph.nodes}

    # Heap entries: (f_score, node)
    heap: list[tuple[float, int]] = [(f_score[start], start)]
    closed: set[int] = set()
    nodes_explored = 0

    found = False
    while heap:
        _, current = heapq.heappop(heap)
        if current in closed:
            continue
        closed.add(current)
        nodes_explored += 1

        if current == end:
            found = True
            break

        for neighbour, weight in graph.adj[current]:
            if neighbour in closed:
                continue
            tentative_g = g_score[current] + weight
            if tentative_g < g_score[neighbour]:
                g_score[neighbour] = tentative_g
                f_score[neighbour] = tentative_g + h(neighbour)
                prev[neighbour] = current
                heapq.heappush(heap, (f_score[neighbour], neighbour))

    # Reconstruct path
    route: list[int] = []
    if found:
        node: int | None = end
        while node is not None:
            route.append(node)
            node = prev[node]
        route.reverse()

    distance = g_score[end] if found else 0.0
    runtime_ms = (time.perf_counter() - t0) * 1000

    return {
        "algorithm": "A*",
        "route": route,
        "distance": round(distance, 4),
        "time": round((distance / AVG_SPEED_KMH) * 60, 4),
        "nodes_explored": nodes_explored,
        "runtime_ms": round(runtime_ms, 4),
    }
