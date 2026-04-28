# RouteIQ DSA Concepts

This document explains the algorithms and data structures used in RouteIQ, where they appear in the codebase, and what role they play in the project.

## Where DSA Fits In The Project

RouteIQ is a delivery route optimization dashboard. The user selects a rider and pending deliveries on the Route Optimization page. The frontend sends those waypoints to the backend endpoint:

`backend/routers/routes.py`

The backend then:

1. Converts rider and delivery coordinates into a graph.
2. Runs multiple custom DSA algorithms.
3. Stores the route and algorithm metrics.
4. Returns the results to the frontend.
5. The frontend displays the selected route, benchmarks, charts, race mode, PDF export, and saved routes.

The main DSA source code lives in:

`backend/dsa/`

## Core Data Structures

| Data Structure | Where Used | Purpose |
| --- | --- | --- |
| Graph | `backend/dsa/graph.py` | Represents delivery locations as nodes and travel distances as weighted edges. |
| Adjacency List | `Graph.adj` in `graph.py` | Stores graph connections efficiently as `node -> [(neighbor, weight)]`. |
| List / Array | Almost everywhere | Stores nodes, routes, waypoints, benchmark results, UI table data, and DP rows. |
| Dictionary / Hash Map | `coords`, `dist`, `prev`, `parent`, `g_score`, `f_score` | Fast lookup for coordinates, shortest distances, parents, and scores. |
| Set | BFS, DFS, Dijkstra, A*, Greedy-NN | Tracks visited or unvisited nodes in O(1) average lookup time. |
| Queue | `bfs.py` using `collections.deque` | Supports first-in-first-out traversal for Breadth-First Search. |
| Stack | `dfs.py` using a Python list | Supports last-in-first-out traversal for Depth-First Search. |
| Min-Heap / Priority Queue | `dijkstra.py`, `astar.py` using `heapq` | Always expands the next lowest-cost node first. |
| Dynamic Programming Table | `tsp_dp.py` | Stores optimal subproblem answers for exact TSP. |
| Bitmask | `tsp_dp.py` | Represents which nodes have already been visited in the TSP state. |
| JSON Strings | `routes.py`, `SavedRoutes.tsx` | Stores and restores waypoints and algorithm results for saved routes. |
| Relational Tables | `backend/models/` | Stores users, riders, deliveries, routes, algorithm runs, and transactions. |

## Graph Representation

File:

`backend/dsa/graph.py`

The `Graph` class is the foundation of the routing engine.

It stores:

- `nodes`: a list of node IDs.
- `coords`: a dictionary mapping node ID to latitude and longitude.
- `adj`: an adjacency list mapping each node to its neighboring nodes and edge weights.

For route optimization, `build_from_coords()` creates a complete weighted graph. This means every waypoint is connected to every other waypoint. The edge weight is the Haversine distance between the two coordinates.

Concept:

A graph is a collection of vertices and edges. In RouteIQ, vertices are rider/delivery locations and edges are possible travel connections between them. Weighted edges allow algorithms to compare paths by distance.

Functionality:

- Converts geographic locations into a DSA-friendly structure.
- Supplies distance and edge weight calculations.
- Feeds BFS, DFS, Dijkstra, A*, Greedy-NN, and TSP-DP.

Complexity:

- `build_from_coords`: Time O(V^2), Space O(V^2), because it creates a complete graph.
- `build_from_geojson`: Time O(E), Space O(V + E), for sparse road data.

## Haversine Distance

File:

`backend/dsa/graph.py`

The private `_haversine()` function calculates real-world great-circle distance between two latitude/longitude points.

Concept:

Latitude and longitude are spherical coordinates. Haversine distance estimates the shortest distance over the Earth's surface.

Functionality:

- Used as edge weight in the graph.
- Used by A* as a heuristic.
- Used by Greedy-NN and TSP-DP to compare delivery stops.

## Breadth-First Search

File:

`backend/dsa/bfs.py`

Data structures used:

- Queue: `deque`
- Set: `visited`
- Dictionary: `parent`

Concept:

BFS explores a graph level by level. It first visits nodes one edge away, then two edges away, and so on.

Functionality in RouteIQ:

- Finds the route with the fewest hops between the first waypoint and last waypoint.
- Acts as a baseline algorithm for comparison.
- It does not guarantee the shortest physical distance when edges have weights.

Where it is called:

`backend/routers/routes.py` inside `/routes/optimize`

Complexity:

- Time O(V + E)
- Space O(V)

## Depth-First Search

File:

`backend/dsa/dfs.py`

Data structures used:

- Stack: Python list of `(node, path)` pairs
- Set: `visited`
- List: current path

Concept:

DFS explores one branch as deeply as possible before backtracking.

Functionality in RouteIQ:

- Finds any valid path between start and end.
- Used as another baseline against smarter shortest-path algorithms.
- Good for showing why a path can be valid but not optimized.

Where it is called:

`backend/routers/routes.py` inside `/routes/optimize`

Complexity:

- Time O(V + E)
- Space O(V)

## Dijkstra's Algorithm

File:

`backend/dsa/dijkstra.py`

Data structures used:

- Min-heap: `heapq`
- Dictionary: `dist`
- Dictionary: `prev`
- Set: `visited`

Concept:

Dijkstra finds the shortest path in a weighted graph with non-negative edge weights. It repeatedly expands the unvisited node with the smallest known distance from the start.

Functionality in RouteIQ:

- Finds the shortest-distance route from the rider/start point to the final waypoint.
- This is the main optimal point-to-point shortest path algorithm.
- Useful when route quality matters more than simple hop count.

Where it is called:

`backend/routers/routes.py` inside `/routes/optimize`

Complexity:

- Time O((V + E) log V)
- Space O(V)

## A* Search

File:

`backend/dsa/astar.py`

Data structures used:

- Min-heap: `heapq`
- Dictionary: `g_score`
- Dictionary: `f_score`
- Dictionary: `prev`
- Set: `closed`

Concept:

A* improves Dijkstra by adding a heuristic. It uses:

`f(n) = g(n) + h(n)`

Where:

- `g(n)` is the real cost from start to the current node.
- `h(n)` is the estimated cost from the current node to the goal.

In RouteIQ, `h(n)` is the Haversine distance to the destination.

Functionality in RouteIQ:

- Finds a shortest path while guiding the search toward the goal.
- Usually explores fewer nodes than Dijkstra when the heuristic is helpful.
- Demonstrates heuristic search in a GIS context.

Where it is called:

`backend/routers/routes.py` inside `/routes/optimize`

Complexity:

- Typical/best practical behavior: O(E log V)
- Worst case can behave like Dijkstra.
- Space O(V)

## Greedy Nearest Neighbor

File:

`backend/dsa/greedy_nn.py`

Data structures used:

- Set: `unvisited`
- List: `route`

Concept:

Greedy Nearest Neighbor solves a travelling-salesman-style tour by repeatedly choosing the closest unvisited node.

Functionality in RouteIQ:

- Builds a full delivery tour that starts at the rider, visits all delivery stops, and returns to the start.
- It is fast and useful for larger routes.
- It is a heuristic, so it does not guarantee the optimal route.

Where it is called:

`backend/routers/routes.py` inside `/routes/optimize`

Complexity:

- Time O(n^2)
- Space O(n)

## TSP Dynamic Programming

File:

`backend/dsa/tsp_dp.py`

Data structures used:

- 2D DP table: `dp[mask][i]`
- 2D parent table: `parent[mask][i]`
- Bitmask integers
- List route reconstruction

Concept:

TSP-DP uses the Held-Karp algorithm to solve the Travelling Salesman Problem exactly.

The DP state is:

`dp[mask][i] = minimum distance to reach node i after visiting the set of nodes in mask`

The bitmask records which nodes are already visited. For example, if bit 3 is set, node 3 has been visited.

Functionality in RouteIQ:

- Computes the exact shortest full delivery tour for smaller waypoint sets.
- Returns to the starting depot/rider.
- Has a `tsp_dp_safe()` wrapper that falls back to Greedy-NN when there are more than 20 nodes, because exact TSP grows exponentially.

Where it is called:

`backend/routers/routes.py` inside `/routes/optimize`

Complexity:

- Time O(2^n * n^2)
- Space O(2^n * n)

## Merge Sort

File:

`backend/dsa/merge_sort.py`

Data structures used:

- Lists
- Recursive splitting
- Temporary merged result list

Concept:

Merge Sort is a divide-and-conquer sorting algorithm. It splits the list into halves, sorts each half recursively, then merges the sorted halves.

Functionality in RouteIQ:

- Provides a from-scratch sorting algorithm for the DSA requirement.
- Used in `backend/dsa/benchmark.py` to benchmark sorting behavior.
- Can sort waypoints, priorities, or other comparable records by a custom key.

Where it is called:

`backend/dsa/benchmark.py`

Complexity:

- Time O(n log n)
- Space O(n)

## Benchmarking

File:

`backend/dsa/benchmark.py`

Endpoint:

`POST /routes/benchmark`

Concept:

Benchmarking measures algorithm runtime and behavior on different input sizes.

Functionality in RouteIQ:

- Generates random coordinates near Islamabad.
- Builds graphs of 10, 50, and 200 nodes.
- Runs BFS, DFS, Dijkstra, A*, Greedy-NN, TSP-DP/fallback, and Merge Sort.
- Records runtime, distance, route length, and nodes explored.
- Uses NetworkX only for validation, not for production routing.

Frontend view:

`frontend/src/pages/AlgorithmComparison.tsx`

This page shows:

- Benchmark table.
- Best algorithm badge.
- Distance chart.
- Runtime chart.
- Big-O theoretical curve visualizer.

## Route Optimization Flow

Frontend:

`frontend/src/pages/RouteOptimization.tsx`

Backend:

`backend/routers/routes.py`

Flow:

1. User selects an available rider.
2. Pending unassigned deliveries become waypoints.
3. The frontend sends the waypoints to `/routes/optimize`.
4. The backend builds a graph using `build_from_coords()`.
5. The backend runs all route algorithms.
6. Results are saved in `Route` and `AlgorithmRun` records.
7. The frontend lets the user select which algorithm's route to view.
8. OSRM is used on the frontend to draw road-shaped geometry between the selected waypoints.

Important distinction:

- The DSA backend decides waypoint order using graph algorithms.
- OSRM is only used to draw realistic road geometry on the map after the DSA route order has been chosen.

## Saved Routes

Backend:

`backend/routers/routes.py`

Frontend:

`frontend/src/components/SavedRoutes.tsx`

Data structures used:

- JSON arrays for saved waypoints.
- JSON arrays for saved algorithm results.
- Frontend arrays to restore and display the route.

Functionality:

- Stores optimized route inputs and outputs.
- Lets the user restore an old optimization result without recomputing it.

## Algorithm Comparison In Simple Terms

| Algorithm | What It Optimizes | Best For | Limitation |
| --- | --- | --- | --- |
| BFS | Fewest edges/hops | Simple unweighted baseline | Ignores distance weights |
| DFS | Finds a valid path | Exploration baseline | Not shortest |
| Dijkstra | Shortest weighted path | Accurate point-to-point routing | Can explore many nodes |
| A* | Shortest weighted path with heuristic guidance | Geographic shortest path | Depends on heuristic quality |
| Greedy-NN | Fast full delivery tour | Larger multi-stop delivery runs | Not guaranteed optimal |
| TSP-DP | Exact shortest full tour | Small multi-stop route optimization | Exponential time and space |
| Merge Sort | Sorted order | Sorting benchmark/data ordering | Not a routing algorithm |

## Why This Project Is DSA-Relevant

RouteIQ is not only a CRUD dashboard. The central feature is a DSA pipeline:

- Graph modeling converts real locations into vertices and weighted edges.
- Traversal algorithms demonstrate graph exploration.
- Shortest-path algorithms solve weighted routing problems.
- Greedy heuristics show fast approximate optimization.
- Dynamic programming solves exact combinatorial optimization for small inputs.
- Sorting demonstrates divide-and-conquer.
- Benchmarking compares runtime, distance, nodes explored, and complexity growth.

This gives the project both practical functionality and clear academic DSA value.
