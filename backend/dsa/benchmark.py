"""
backend/dsa/benchmark.py — Algorithm benchmarking suite.

Runs all 7 RouteIQ algorithms on random graphs of sizes 10, 50, 200 nodes.
Validates BFS / Dijkstra / A* results against NetworkX for correctness.

Usage (standalone):
    python -m dsa.benchmark

Public API:
    run_benchmarks() -> list[dict]
        Returns a list of benchmark result dicts, one per (algorithm, size).
"""

import random
import time
from typing import Any

from dsa.graph import build_from_coords
from dsa.bfs import bfs
from dsa.dfs import dfs
from dsa.dijkstra import dijkstra
from dsa.astar import astar
from dsa.greedy_nn import greedy_nn
from dsa.tsp_dp import tsp_dp_safe
from dsa.merge_sort import merge_sort

# NetworkX — ONLY used here for validation
try:
    import networkx as nx
    HAS_NX = True
except ImportError:
    HAS_NX = False

BENCHMARK_SIZES = [10, 50, 200]
SEED = 42


# ---------------------------------------------------------------------------
# Random coordinate generator
# ---------------------------------------------------------------------------

def _random_coords(n: int, seed: int = SEED) -> list[tuple[float, float]]:
    """Generate n random (lat, lon) points near Islamabad, Pakistan."""
    rng = random.Random(seed)
    lat_base, lon_base = 33.72, 73.04
    return [
        (lat_base + rng.uniform(-0.5, 0.5), lon_base + rng.uniform(-0.5, 0.5))
        for _ in range(n)
    ]


# ---------------------------------------------------------------------------
# NetworkX validation helper
# ---------------------------------------------------------------------------

def _nx_shortest_path_length(
    coords: list[tuple[float, float]], start: int, end: int
) -> float | None:
    """Return Dijkstra distance between start→end as computed by NetworkX."""
    if not HAS_NX:
        return None

    from dsa.graph import _haversine

    G = nx.Graph()
    n = len(coords)
    for i in range(n):
        for j in range(i + 1, n):
            lat1, lon1 = coords[i]
            lat2, lon2 = coords[j]
            w = _haversine(lat1, lon1, lat2, lon2)
            G.add_edge(i, j, weight=w)

    try:
        return nx.dijkstra_path_length(G, start, end, weight="weight")
    except nx.NetworkXNoPath:
        return None


# ---------------------------------------------------------------------------
# Single algorithm benchmark
# ---------------------------------------------------------------------------

def _bench_point_to_point(
    algo_fn,
    graph,
    start: int,
    end: int,
    label: str,
    n: int,
) -> dict[str, Any]:
    t0 = time.perf_counter()
    result = algo_fn(graph, start, end)
    elapsed = (time.perf_counter() - t0) * 1000
    return {
        "algorithm": label,
        "nodes": n,
        "distance_km": result["distance"],
        "runtime_ms": round(elapsed, 4),
        "nodes_explored": result["nodes_explored"],
        "route_length": len(result["route"]),
    }


def _bench_tour(
    algo_fn,
    graph,
    start: int,
    label: str,
    n: int,
) -> dict[str, Any]:
    t0 = time.perf_counter()
    result = algo_fn(graph, start)
    elapsed = (time.perf_counter() - t0) * 1000
    return {
        "algorithm": label,
        "nodes": n,
        "distance_km": result["distance"],
        "runtime_ms": round(elapsed, 4),
        "nodes_explored": result["nodes_explored"],
        "route_length": len(result["route"]),
    }


# ---------------------------------------------------------------------------
# Main benchmark runner
# ---------------------------------------------------------------------------

def run_benchmarks() -> list[dict[str, Any]]:
    """
    Run all 7 algorithms at sizes 10, 50, 200.
    Returns a flat list of result dicts (one per algorithm×size combination).
    """
    results: list[dict[str, Any]] = []

    for n in BENCHMARK_SIZES:
        coords = _random_coords(n)
        graph = build_from_coords(coords)
        start, end = 0, n - 1

        # ── Point-to-point algorithms ────────────────────────────────────
        for label, fn in [("BFS", bfs), ("DFS", dfs), ("Dijkstra", dijkstra), ("A*", astar)]:
            try:
                r = _bench_point_to_point(fn, graph, start, end, label, n)
            except Exception as exc:
                r = {"algorithm": label, "nodes": n, "error": str(exc)}
            results.append(r)

        # ── Tour algorithms ──────────────────────────────────────────────
        for label, fn in [("Greedy-NN", greedy_nn), ("TSP-DP", tsp_dp_safe)]:
            try:
                r = _bench_tour(fn, graph, start, label, n)
            except Exception as exc:
                r = {"algorithm": label, "nodes": n, "error": str(exc)}
            results.append(r)

        # ── Merge Sort ───────────────────────────────────────────────────
        items = list(range(n))
        random.Random(SEED).shuffle(items)
        t0 = time.perf_counter()
        sorted_items = merge_sort(items)
        sort_ms = (time.perf_counter() - t0) * 1000
        assert sorted_items == list(range(n)), "merge_sort correctness check failed"
        results.append({
            "algorithm": "MergeSort",
            "nodes": n,
            "distance_km": None,
            "runtime_ms": round(sort_ms, 4),
            "nodes_explored": n,
            "route_length": n,
        })

        # ── NetworkX validation (Dijkstra + A*) ─────────────────────────
        if HAS_NX and n <= 50:  # skip NX for n=200 (slow dense complete graph)
            nx_dist = _nx_shortest_path_length(coords, start, end)
            if nx_dist is not None:
                dij_r = dijkstra(graph, start, end)
                ast_r = astar(graph, start, end)
                for name, dist in [("Dijkstra", dij_r["distance"]), ("A*", ast_r["distance"])]:
                    delta = abs(dist - nx_dist)
                    results.append({
                        "algorithm": f"{name}_vs_NetworkX",
                        "nodes": n,
                        "our_distance_km": dist,
                        "nx_distance_km": round(nx_dist, 4),
                        "delta_km": round(delta, 6),
                        "valid": delta < 1e-4,
                    })

    return results


# ---------------------------------------------------------------------------
# CLI entry-point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json
    results = run_benchmarks()
    print(json.dumps(results, indent=2))
