"""
backend/dsa/graph.py — Graph builder for RouteIQ DSA engine.

Builds a weighted, undirected adjacency-list graph from either:
  1. A list of (lat, lon) delivery waypoints (mock / real).
  2. A GeoJSON FeatureCollection of LineString road segments.

The distance between two nodes is the Haversine great-circle distance in km.

Public API
----------
build_from_coords(coords: list[tuple[float, float]]) -> Graph
    Build a complete graph where every pair of waypoints is connected.
    This is the mode used by BFS, DFS, Dijkstra, A*, Greedy-NN, TSP-DP.

build_from_geojson(geojson: dict) -> Graph
    Build a sparse graph from road LineString features.

Graph structure
---------------
graph.nodes  : list[int]          — node ids (0-indexed)
graph.coords : dict[int, (lat,lon)] — lat/lon per node
graph.adj    : dict[int, list[(neighbour_id, weight_km)]]

Big-O Complexity
----------------
add_node, add_edge, distance, edge_weight: Time O(1), Space O(1)
build_from_coords: Time O(V²), Space O(V²)
build_from_geojson: Time O(E), Space O(V + E)
"""

import math
from typing import Optional


# ---------------------------------------------------------------------------
# Haversine distance (km)
# ---------------------------------------------------------------------------

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in km between two (lat, lon) points."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Graph class
# ---------------------------------------------------------------------------

class Graph:
    """Lightweight weighted adjacency-list graph."""

    def __init__(self) -> None:
        """Initialize an empty Graph data structure."""
        self.nodes: list[int] = []
        self.coords: dict[int, tuple[float, float]] = {}      # node_id -> (lat, lon)
        self.adj: dict[int, list[tuple[int, float]]] = {}     # node_id -> [(nbr, km)]

    # ------------------------------------------------------------------
    def add_node(self, node_id: int, lat: float, lon: float) -> None:
        """Add a new node to the graph with its geographic coordinates."""
        if node_id not in self.coords:
            self.nodes.append(node_id)
            self.coords[node_id] = (lat, lon)
            self.adj[node_id] = []

    def add_edge(self, u: int, v: int, weight: Optional[float] = None) -> None:
        """Add undirected edge; weight is Haversine distance if not supplied."""
        if weight is None:
            lat1, lon1 = self.coords[u]
            lat2, lon2 = self.coords[v]
            weight = _haversine(lat1, lon1, lat2, lon2)
        self.adj[u].append((v, weight))
        self.adj[v].append((u, weight))

    # ------------------------------------------------------------------
    def distance(self, u: int, v: int) -> float:
        """Direct Haversine distance between two nodes (km)."""
        lat1, lon1 = self.coords[u]
        lat2, lon2 = self.coords[v]
        return _haversine(lat1, lon1, lat2, lon2)

    def edge_weight(self, u: int, v: int) -> float:
        """Return weight of edge (u, v); falls back to Haversine if no edge."""
        for nbr, w in self.adj[u]:
            if nbr == v:
                return w
        # Fallback for complete-graph lookups
        return self.distance(u, v)

    def __len__(self) -> int:
        """Return the total number of nodes in the graph."""
        return len(self.nodes)

    def __repr__(self) -> str:
        """Return a string representation showing node and edge counts."""
        return f"Graph(nodes={len(self.nodes)}, edges={sum(len(v) for v in self.adj.values())//2})"


# ---------------------------------------------------------------------------
# Builders
# ---------------------------------------------------------------------------

def build_from_coords(coords: list[tuple[float, float]]) -> Graph:
    """
    Build a **complete** weighted graph from a list of (lat, lon) tuples.
    Node IDs are assigned 0, 1, …, n-1 in the order given.

    Parameters
    ----------
    coords : list of (lat, lon) tuples  (at least 2 entries)

    Returns
    -------
    Graph — fully connected, undirected, with Haversine edge weights (km).
    """
    if len(coords) < 2:
        raise ValueError("At least 2 coordinates are required to build a graph.")

    g = Graph()
    for i, (lat, lon) in enumerate(coords):
        g.add_node(i, lat, lon)

    # Complete graph — O(n²) edges
    n = len(coords)
    for i in range(n):
        for j in range(i + 1, n):
            g.add_edge(i, j)

    return g


def build_from_geojson(geojson: dict) -> Graph:
    """
    Build a graph from a GeoJSON FeatureCollection of LineString features.

    Each consecutive pair of coordinates in a LineString becomes an edge.
    Coordinates are (lon, lat) per GeoJSON spec — we store as (lat, lon).

    Parameters
    ----------
    geojson : dict — GeoJSON FeatureCollection

    Returns
    -------
    Graph — sparse graph from road network.
    """
    g = Graph()
    node_map: dict[tuple[float, float], int] = {}  # (lat, lon) -> node_id
    next_id = 0

    def _get_or_create(lat: float, lon: float) -> int:
        nonlocal next_id
        key = (round(lat, 7), round(lon, 7))
        if key not in node_map:
            node_map[key] = next_id
            g.add_node(next_id, lat, lon)
            next_id += 1
        return node_map[key]

    features = geojson.get("features", [])
    for feature in features:
        geom = feature.get("geometry", {})
        if geom.get("type") != "LineString":
            continue
        line_coords = geom.get("coordinates", [])
        for k in range(len(line_coords) - 1):
            lon1, lat1 = line_coords[k][:2]
            lon2, lat2 = line_coords[k + 1][:2]
            u = _get_or_create(lat1, lon1)
            v = _get_or_create(lat2, lon2)
            if u != v:
                g.add_edge(u, v)

    return g
