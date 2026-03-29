# RouteIQ

Full-stack GIS-based delivery route optimization dashboard.

## Project Information

- **Student:** Muhammad Hamza Khan
- **CMS ID:** 5081939
- **University:** NUST IGIS-2024
- **Course:** CS-250 Data Structures & Algorithms (4th Semester)

## Description

RouteIQ is a full-stack, GIS-based logistics dashboard specifically engineered to showcase Data Structures and algorithm (DSA) implementations in a real-world scenario. It simulates a delivery network where dispatchers assign deliveries to riders, and optimized routes are generated dynamically. The engine implements seven custom graph and sorting algorithms entirely from scratch in pure Python (no external graph libraries like networkx or scipy used).

## Live Demos

- **Frontend (Vercel):** [https://routeiq-eight.vercel.app](https://routeiq-eight.vercel.app)
- **Backend API (Render):** [https://routeiq-backend-lkz1.onrender.com](https://routeiq-backend-lkz1.onrender.com) (Go to `/docs` for the Swagger UI)

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, MapLibre GL, ECharts, React Query, Zustand |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2 |
| **Database** | PostgreSQL (Neon serverless) |
| **Auth** | JWT (JSON Web Tokens) with hashed passwords |
| **Deployment** | Vercel (Frontend), Railway/Render (Backend API/DB) |

## Algorithms & Complexity

The core DSA engine solves shortest paths and Travelling Salesman Problems (TSP) over a Haversine-weighted graph.

| Algorithm | Type | Time Complexity | Space Complexity | Use Case in RouteIQ |
| --- | --- | --- | --- | --- |
| **BFS** | Graph Search | O(V + E) | O(V) | Shortest hop-count baseline |
| **DFS** | Graph Search | O(V + E) | O(V) | Path exploration baseline |
| **Dijkstra** | Shortest Path | O((V + E) log V) | O(V) | Optimal shortest path (A to B) |
| **A\*** | Shortest Path | O(E log V) | O(V) | Heuristic shortest path (using Haversine) |
| **Greedy NN** | TSP Heuristic | O(n²) | O(n) | Fast approximate multi-stop tour |
| **TSP DP** | TSP Exact | O(2ⁿ · n²) | O(2ⁿ · n) | Exact multi-stop tour (Held-Karp) |
| **Merge Sort** | Sorting | O(n log n) | O(n) | Key-based sorting of lists/waypoints |

## Architecture Overview

**1. Database Layer:** PostgreSQL storing Users, Riders, Deliveries, and Algorithm Runs metrics.
**2. API Layer:** FastAPI providing async REST endpoints and business logic, tightly integrated with Pydantic for validation schemas. 
**3. DSA Engine:** A pure Python module (`backend/dsa/`) containing custom Graph representations and seven algorithm implementations. A benchmark runner coordinates concurrent test sweeps on mock nodes to generate comparative metrics.
**4. Frontend GUI:** A modular React SPA calling the API, visualizing routes on interactive 2D maps, and rendering algorithmic performance charts.

## Local Development Setup

Clone the repository and follow these instructions to run the application locally.

### 1. Backend (`/backend`)
```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env # And configure DATABASE_URL
alembic upgrade head
uvicorn main:app --reload
```

### 2. Frontend (`/frontend`)
```bash
cd frontend
npm install
cp .env.example .env # Usually needs VITE_API_URL=http://localhost:8000
npm run dev
```

Run tests in the backend using `pytest -v`.
