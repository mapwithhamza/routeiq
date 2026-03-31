"""
backend/routers/routes.py — Route optimization endpoints.

POST /routes/optimize  — accept waypoints, run all 7 algorithms, return results
GET  /routes/{id}      — fetch a stored route with its stops + algorithm runs
POST /routes/benchmark — run the benchmark suite and return raw results
"""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from auth import get_current_user
from database import get_db
from models.route import Route, RouteStatus
from models.algorithm_run import AlgorithmRun
from models.user import User
from schemas.route import RouteRead, RouteSummary

from dsa.graph import build_from_coords
from dsa.bfs import bfs
from dsa.dfs import dfs
from dsa.dijkstra import dijkstra
from dsa.astar import astar
from dsa.greedy_nn import greedy_nn
from dsa.tsp_dp import tsp_dp_safe
from dsa.benchmark import run_benchmarks

router = APIRouter()


# ── Pydantic request/response schemas ────────────────────────────────────────

class Waypoint(BaseModel):
    lat: float
    lon: float
    label: str | None = None


class OptimizeRequest(BaseModel):
    name: str = "Optimized Route"
    rider_id: int | None = None
    waypoints: list[Waypoint]


class AlgorithmResult(BaseModel):
    algorithm: str
    route: list[int]
    distance: float
    time: float
    nodes_explored: int
    runtime_ms: float


class OptimizeResponse(BaseModel):
    route_id: int
    name: str
    waypoints: list[Waypoint]
    results: list[AlgorithmResult]


# ── POST /routes/optimize ─────────────────────────────────────────────────────
@router.post(
    "/optimize",
    response_model=OptimizeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def optimize_route(
    payload: OptimizeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Run all 7 routing algorithms on the given waypoints.
    Persists a Route + AlgorithmRun rows; returns all algorithm results.
    """
    if len(payload.waypoints) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least 2 waypoints are required.",
        )

    # Build graph
    coords = [(wp.lat, wp.lon) for wp in payload.waypoints]
    graph = build_from_coords(coords)
    start, end = 0, len(coords) - 1

    # Persist Route
    route_obj = Route(
        name=payload.name,
        rider_id=payload.rider_id,
        status=RouteStatus.active,
    )
    db.add(route_obj)
    await db.flush()
    await db.refresh(route_obj)

    # Run all 7 algorithms
    point_to_point_algos = [
        ("BFS", lambda g: bfs(g, start, end)),
        ("DFS", lambda g: dfs(g, start, end)),
        ("Dijkstra", lambda g: dijkstra(g, start, end)),
        ("A*", lambda g: astar(g, start, end)),
    ]
    tour_algos = [
        ("Greedy-NN", lambda g: greedy_nn(g, start)),
        ("TSP-DP", lambda g: tsp_dp_safe(g, start)),
    ]

    algo_results: list[AlgorithmResult] = []
    for name, fn in point_to_point_algos + tour_algos:
        try:
            res = fn(graph)
        except Exception as exc:
            res = {
                "algorithm": name,
                "route": [],
                "distance": 0.0,
                "time": 0.0,
                "nodes_explored": 0,
                "runtime_ms": 0.0,
            }

        # Persist AlgorithmRun
        run = AlgorithmRun(
            route_id=route_obj.id,
            algorithm_name=res["algorithm"],
            distance_km=res["distance"],
            duration_min=res["time"],
            nodes_explored=res["nodes_explored"],
            runtime_ms=res["runtime_ms"],
        )
        db.add(run)

        algo_results.append(AlgorithmResult(**res))

    # Save waypoints and results as JSON
    route_obj.waypoints_json = json.dumps([
        {"lat": wp.lat, "lon": wp.lon, "label": wp.label}
        for wp in payload.waypoints
    ])
    route_obj.algorithm_results_json = json.dumps([
        {
            "algorithm": r.algorithm,
            "route": r.route,
            "distance": r.distance,
            "time": r.time,
            "nodes_explored": r.nodes_explored,
            "runtime_ms": r.runtime_ms,
        }
        for r in algo_results
    ])
    await db.flush()

    return OptimizeResponse(
        route_id=route_obj.id,
        name=route_obj.name,
        waypoints=payload.waypoints,
        results=algo_results,
    )


# ── GET /routes ───────────────────────────────────────────────────────────────
@router.get("", response_model=list[RouteSummary])
async def list_routes(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return all saved routes, newest first."""
    result = await db.execute(select(Route).order_by(Route.created_at.desc()))
    routes = result.scalars().all()
    return routes


# ── GET /routes/{id} ──────────────────────────────────────────────────────────
@router.get("/{route_id}", response_model=RouteRead)
async def get_route(
    route_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Route).where(Route.id == route_id))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return route


# ── POST /routes/benchmark ────────────────────────────────────────────────────
@router.post("/benchmark", status_code=status.HTTP_200_OK)
async def benchmark(
    _: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """
    Run the full benchmark suite (10 / 50 / 200 nodes) for all algorithms.
    Returns raw results list — may take a few seconds.
    """
    return run_benchmarks()
