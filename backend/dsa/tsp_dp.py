"""
backend/dsa/tsp_dp.py — TSP exact solver via bitmask DP (Held-Karp, pure Python).

Solves the Travelling Salesman Problem exactly using dynamic programming with
bitmask state representation.

Big-O Complexity
----------------
Time:  O(2ⁿ · n²)  — practical only for n ≤ ~20 nodes.
Space: O(2ⁿ · n)   — DP table dimensions.

Return format:
{
    "algorithm":      "TSP-DP",
    "route":          list[int],   — optimal tour, last node == start
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
MAX_NODES = 20  # Hard limit — bitmask DP blows up above this


def tsp_dp(graph: Graph, start: int = 0) -> dict:
    """
    Held-Karp exact TSP via bitmask DP.

    Parameters
    ----------
    graph : Graph  — complete weighted graph
    start : int    — depot / starting node (default 0)

    Returns
    -------
    Standard result dict with the optimal Hamiltonian circuit.

    Raises
    ------
    ValueError — if graph has more than MAX_NODES nodes (falls back to Greedy-NN
                 result rather than crashing the API — see `tsp_dp_safe` below).
    """
    t0 = time.perf_counter()
    nodes = graph.nodes
    n = len(nodes)

    if n > MAX_NODES:
        raise ValueError(
            f"TSP-DP supports at most {MAX_NODES} nodes; got {n}. "
            "Use Greedy-NN for larger instances."
        )

    # Re-index: map graph node ids → 0..n-1 (start must be index 0)
    # Put `start` first so index 0 == depot
    ordered = [start] + [nd for nd in nodes if nd != start]
    idx = {nd: i for i, nd in enumerate(ordered)}  # node_id -> local index

    def cost(i: int, j: int) -> float:
        """Return distance cost between ordered nodes i and j."""
        return graph.distance(ordered[i], ordered[j])

    FULL_MASK = (1 << n) - 1

    # dp[mask][i] = min distance to reach node i having visited the set `mask`
    dp: list[list[float]] = [[inf] * n for _ in range(1 << n)]
    parent: list[list[int]] = [[-1] * n for _ in range(1 << n)]

    dp[1][0] = 0.0  # start at depot (index 0), mask = 1 (only depot visited)

    nodes_explored = 0
    for mask in range(1 << n):
        for u in range(n):
            if dp[mask][u] == inf:
                continue
            if not (mask >> u & 1):
                continue
            for v in range(n):
                if mask >> v & 1:
                    continue
                new_mask = mask | (1 << v)
                new_dist = dp[mask][u] + cost(u, v)
                nodes_explored += 1
                if new_dist < dp[new_mask][v]:
                    dp[new_mask][v] = new_dist
                    parent[new_mask][v] = u

    # Close the tour: return to depot (index 0)
    best_dist = inf
    last_node = -1
    for u in range(1, n):
        candidate = dp[FULL_MASK][u] + cost(u, 0)
        if candidate < best_dist:
            best_dist = candidate
            last_node = u

    # Reconstruct tour in local indices
    path_idx: list[int] = []
    mask = FULL_MASK
    cur = last_node
    while cur != -1:
        path_idx.append(cur)
        prev = parent[mask][cur]
        mask ^= (1 << cur)
        cur = prev
    path_idx.reverse()
    path_idx.append(0)  # return to depot

    # Convert local indices back to graph node ids
    route = [ordered[i] for i in path_idx]

    runtime_ms = (time.perf_counter() - t0) * 1000

    return {
        "algorithm": "TSP-DP",
        "route": route,
        "distance": round(best_dist, 4),
        "time": round((best_dist / AVG_SPEED_KMH) * 60, 4),
        "nodes_explored": nodes_explored,
        "runtime_ms": round(runtime_ms, 4),
    }


def tsp_dp_safe(graph: Graph, start: int = 0) -> dict:
    """
    Wrapper that falls back to Greedy-NN when the graph is too large for DP.
    Used by the /routes/optimize endpoint so it never raises.
    """
    from dsa.greedy_nn import greedy_nn

    if len(graph) > MAX_NODES:
        result = greedy_nn(graph, start)
        result["algorithm"] = "TSP-DP(fallback→Greedy-NN)"
        return result
    return tsp_dp(graph, start)
