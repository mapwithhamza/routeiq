"""
tests/test_algorithms.py — DSA algorithm unit tests + /routes endpoint integration tests.

Structure
---------
Section A: Pure unit tests (no DB, no HTTP) for each DSA module.
Section B: Integration tests via HTTP against the FastAPI app.
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION A — Pure DSA unit tests (import directly, no HTTP)
# ═══════════════════════════════════════════════════════════════════════════════

# ── graph.py ──────────────────────────────────────────────────────────────────

def test_graph_build_from_coords_node_count():
    from dsa.graph import build_from_coords
    coords = [(33.72, 73.04), (33.73, 73.05), (33.74, 73.06)]
    g = build_from_coords(coords)
    assert len(g.nodes) == 3


def test_graph_build_from_coords_complete():
    """Complete graph: n nodes → n*(n-1)/2 edges."""
    from dsa.graph import build_from_coords
    n = 5
    coords = [(33.7 + i * 0.01, 73.0 + i * 0.01) for i in range(n)]
    g = build_from_coords(coords)
    edge_count = sum(len(v) for v in g.adj.values()) // 2
    assert edge_count == n * (n - 1) // 2


def test_graph_haversine_positive():
    from dsa.graph import build_from_coords
    g = build_from_coords([(33.72, 73.04), (33.73, 73.05)])
    d = g.distance(0, 1)
    assert d > 0


def test_graph_min_nodes_error():
    from dsa.graph import build_from_coords
    import pytest
    with pytest.raises(ValueError):
        build_from_coords([(33.72, 73.04)])


def test_graph_geojson():
    from dsa.graph import build_from_geojson
    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[73.04, 33.72], [73.05, 33.73], [73.06, 33.74]]
            }
        }]
    }
    g = build_from_geojson(geojson)
    assert len(g.nodes) == 3


# ── bfs.py ────────────────────────────────────────────────────────────────────

def _small_graph():
    from dsa.graph import build_from_coords
    coords = [(33.72 + i * 0.01, 73.04 + i * 0.01) for i in range(5)]
    return build_from_coords(coords)


def test_bfs_finds_path():
    from dsa.bfs import bfs
    g = _small_graph()
    result = bfs(g, 0, 4)
    assert result["algorithm"] == "BFS"
    assert result["route"][0] == 0
    assert result["route"][-1] == 4
    assert result["distance"] > 0
    assert result["nodes_explored"] > 0
    assert result["runtime_ms"] >= 0


def test_bfs_same_start_end():
    from dsa.bfs import bfs
    g = _small_graph()
    result = bfs(g, 2, 2)
    assert result["route"] == [2]
    assert result["distance"] == 0.0


def test_bfs_result_keys():
    from dsa.bfs import bfs
    g = _small_graph()
    result = bfs(g, 0, 4)
    for key in ("algorithm", "route", "distance", "time", "nodes_explored", "runtime_ms"):
        assert key in result


# ── dfs.py ────────────────────────────────────────────────────────────────────

def test_dfs_finds_path():
    from dsa.dfs import dfs
    g = _small_graph()
    result = dfs(g, 0, 4)
    assert result["algorithm"] == "DFS"
    assert result["route"][0] == 0
    assert result["route"][-1] == 4
    assert result["distance"] > 0


def test_dfs_result_keys():
    from dsa.dfs import dfs
    g = _small_graph()
    result = dfs(g, 0, 4)
    for key in ("algorithm", "route", "distance", "time", "nodes_explored", "runtime_ms"):
        assert key in result


# ── dijkstra.py ───────────────────────────────────────────────────────────────

def test_dijkstra_finds_shortest():
    from dsa.dijkstra import dijkstra
    g = _small_graph()
    result = dijkstra(g, 0, 4)
    assert result["algorithm"] == "Dijkstra"
    assert result["route"][0] == 0
    assert result["route"][-1] == 4
    assert result["distance"] > 0


def test_dijkstra_optimal_vs_bfs():
    """Dijkstra distance should be <= BFS distance (BFS is hop-optimal not dist-optimal)."""
    from dsa.dijkstra import dijkstra
    from dsa.bfs import bfs
    g = _small_graph()
    dij = dijkstra(g, 0, 4)
    b = bfs(g, 0, 4)
    assert dij["distance"] <= b["distance"] + 1e-6


# ── astar.py ─────────────────────────────────────────────────────────────────

def test_astar_finds_path():
    from dsa.astar import astar
    g = _small_graph()
    result = astar(g, 0, 4)
    assert result["algorithm"] == "A*"
    assert result["route"][0] == 0
    assert result["route"][-1] == 4


def test_astar_matches_dijkstra():
    """A* with admissible heuristic must find same distance as Dijkstra."""
    from dsa.astar import astar
    from dsa.dijkstra import dijkstra
    g = _small_graph()
    ast = astar(g, 0, 4)
    dij = dijkstra(g, 0, 4)
    assert abs(ast["distance"] - dij["distance"]) < 1e-4


# ── greedy_nn.py ──────────────────────────────────────────────────────────────

def test_greedy_nn_tour():
    from dsa.greedy_nn import greedy_nn
    g = _small_graph()
    result = greedy_nn(g, 0)
    assert result["algorithm"] == "Greedy-NN"
    # Tour: starts and ends at depot
    assert result["route"][0] == 0
    assert result["route"][-1] == 0
    # Visits all nodes
    assert len(set(result["route"])) == len(g.nodes)
    assert result["distance"] > 0


# ── tsp_dp.py ────────────────────────────────────────────────────────────────

def test_tsp_dp_small():
    from dsa.tsp_dp import tsp_dp
    g = _small_graph()
    result = tsp_dp(g, 0)
    assert result["algorithm"] == "TSP-DP"
    assert result["route"][0] == 0
    assert result["route"][-1] == 0
    assert len(set(result["route"])) == len(g.nodes)
    assert result["distance"] > 0


def test_tsp_dp_optimal_le_greedy():
    """TSP-DP (exact) distance must be <= Greedy-NN (heuristic) distance."""
    from dsa.tsp_dp import tsp_dp
    from dsa.greedy_nn import greedy_nn
    g = _small_graph()
    dp = tsp_dp(g, 0)
    nn = greedy_nn(g, 0)
    assert dp["distance"] <= nn["distance"] + 1e-6


def test_tsp_dp_safe_large():
    """tsp_dp_safe must not raise for >20-node graph; falls back to Greedy-NN."""
    from dsa.tsp_dp import tsp_dp_safe
    from dsa.graph import build_from_coords
    coords = [(33.72 + i * 0.005, 73.04 + i * 0.005) for i in range(25)]
    g = build_from_coords(coords)
    result = tsp_dp_safe(g, 0)
    assert result["distance"] > 0


# ── merge_sort.py ─────────────────────────────────────────────────────────────

def test_merge_sort_integers():
    from dsa.merge_sort import merge_sort
    assert merge_sort([3, 1, 4, 1, 5, 9, 2, 6]) == [1, 1, 2, 3, 4, 5, 6, 9]


def test_merge_sort_empty():
    from dsa.merge_sort import merge_sort
    assert merge_sort([]) == []


def test_merge_sort_single():
    from dsa.merge_sort import merge_sort
    assert merge_sort([42]) == [42]


def test_merge_sort_with_key():
    from dsa.merge_sort import merge_sort
    data = [{"p": 3}, {"p": 1}, {"p": 2}]
    result = merge_sort(data, key=lambda x: x["p"])
    assert [d["p"] for d in result] == [1, 2, 3]


def test_merge_sort_does_not_mutate():
    from dsa.merge_sort import merge_sort
    original = [5, 3, 1]
    merge_sort(original)
    assert original == [5, 3, 1]


# ── benchmark.py ─────────────────────────────────────────────────────────────

def test_benchmark_runs_without_error():
    from dsa.benchmark import run_benchmarks
    results = run_benchmarks()
    assert isinstance(results, list)
    assert len(results) > 0


def test_benchmark_all_sizes_covered():
    from dsa.benchmark import run_benchmarks, BENCHMARK_SIZES
    results = run_benchmarks()
    observed_sizes = {r["nodes"] for r in results if "nodes" in r}
    for size in BENCHMARK_SIZES:
        assert size in observed_sizes


def test_benchmark_nx_validation_passes():
    """If NetworkX is installed, Dijkstra/A* delta must be < 1e-4 km."""
    try:
        import networkx  # noqa
    except ImportError:
        pytest.skip("NetworkX not installed")
    from dsa.benchmark import run_benchmarks
    results = run_benchmarks()
    validation_rows = [r for r in results if "_vs_NetworkX" in r.get("algorithm", "")]
    assert len(validation_rows) > 0, "Expected NetworkX validation rows"
    for row in validation_rows:
        assert row["valid"], f"Validation failed: {row}"


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION B — HTTP integration tests via FastAPI test client
# ═══════════════════════════════════════════════════════════════════════════════

async def _authed_client(client: AsyncClient) -> AsyncClient:
    import uuid
    email = f"alg_{uuid.uuid4().hex[:8]}@routeiq-test.dev"
    await client.post("/auth/register", json={"email": email, "password": "Pass123!"})
    await client.post("/auth/login", json={"email": email, "password": "Pass123!"})
    return client


WAYPOINTS = [
    {"lat": 33.72, "lon": 73.04},
    {"lat": 33.73, "lon": 73.05},
    {"lat": 33.74, "lon": 73.06},
]


async def test_optimize_unauth(client: AsyncClient):
    resp = await client.post("/routes/optimize", json={"waypoints": WAYPOINTS})
    assert resp.status_code == 401, resp.text


async def test_optimize_too_few_waypoints(client: AsyncClient):
    await _authed_client(client)
    resp = await client.post(
        "/routes/optimize",
        json={"waypoints": [{"lat": 33.72, "lon": 73.04}]},
    )
    assert resp.status_code == 422, resp.text


async def test_optimize_returns_all_algorithms(client: AsyncClient):
    await _authed_client(client)
    resp = await client.post(
        "/routes/optimize",
        json={"name": "Test Route", "waypoints": WAYPOINTS},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert "route_id" in body
    assert "results" in body
    algo_names = {r["algorithm"] for r in body["results"]}
    # All 6 algorithms (7 total minus MergeSort which has no route)
    expected = {"BFS", "DFS", "Dijkstra", "A*", "Greedy-NN"}
    assert expected.issubset(algo_names), f"Missing algorithms: {expected - algo_names}"


async def test_optimize_result_structure(client: AsyncClient):
    await _authed_client(client)
    resp = await client.post(
        "/routes/optimize",
        json={"name": "Structure Test", "waypoints": WAYPOINTS},
    )
    assert resp.status_code == 201, resp.text
    for result in resp.json()["results"]:
        for key in ("algorithm", "route", "distance", "time", "nodes_explored", "runtime_ms"):
            assert key in result, f"Key '{key}' missing from result: {result}"


async def test_get_route(client: AsyncClient):
    await _authed_client(client)
    create = await client.post(
        "/routes/optimize",
        json={"name": "Fetch Test", "waypoints": WAYPOINTS},
    )
    assert create.status_code == 201, create.text
    route_id = create.json()["route_id"]

    resp = await client.get(f"/routes/{route_id}")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["id"] == route_id


async def test_get_route_not_found(client: AsyncClient):
    await _authed_client(client)
    resp = await client.get("/routes/999999")
    assert resp.status_code == 404, resp.text


async def test_benchmark_endpoint(client: AsyncClient):
    await _authed_client(client)
    resp = await client.post("/routes/benchmark")
    assert resp.status_code == 200, resp.text
    results = resp.json()
    assert isinstance(results, list)
    assert len(results) > 0
