# RouteIQ — Claude Code Project Brain
# Read this file completely before doing ANYTHING in this project.

## What This Project Is
RouteIQ is a full-stack GIS-based delivery route optimization dashboard.
- **Student:** Muhammad Hamza Khan | CMS 5081939 | NUST IGIS-2024
- **Course:** CS-250 Data Structures & Algorithms (4th Semester)
- **GitHub:** github.com/mapwithhamza
- **PRD:** See `/PRD/RouteIQ_PRD_v2.docx` for full requirements

## Non-Negotiable Rules (Follow Every Single Time)
1. **Never install a package without checking compatibility first.** All packages must match the versions in the stack below.
2. **Never create a file that duplicates logic from another file.** Check existing files before creating new ones.
3. **Never use `python-jose`** — it has CVEs. Use `PyJWT 2.x` only.
4. **Never use raw `leaflet` or `react-leaflet`** — project uses `maplibre-gl` + `react-map-gl`.
5. **Never use raw `echarts` DOM API in React** — always use `echarts-for-react` wrapper.
6. **Never hardcode secrets** — DB URL, JWT secret, CORS origin must come from `.env` via `pydantic-settings`.
7. **Never use `WidthType.PERCENTAGE` in any docx generation.**
8. **Always run `alembic upgrade head` after any model change.**
9. **Always update `PROGRESS.md` after completing any phase or sub-task.**
10. **Always keep frontend and backend in separate folders:** `/frontend` and `/backend`.

## Exact Tech Stack (Pin These Versions)

### Frontend (`/frontend`)
| Package | Version | Notes |
|---|---|---|
| react | 18.x | |
| typescript | 5.x | |
| vite | 5.x | |
| tailwindcss | 3.x | content: ['./src/**/*.{ts,tsx}'] |
| maplibre-gl | 4.x | NOT leaflet, NOT mapbox |
| react-map-gl | 7.x | Wrapper for maplibre-gl |
| echarts | 5.x | |
| echarts-for-react | 3.x | React wrapper — always use this, never raw echarts |
| axios | 1.x | Set withCredentials: true globally |
| @tanstack/react-query | 5.x | NOT v4 |
| react-router-dom | 6.x | |
| react-hook-form | 7.x | |
| zod | 3.x | |
| @hookform/resolvers | 3.x | |
| sonner | 1.x | Toast notifications |

### Backend (`/backend`)
| Package | Version | Notes |
|---|---|---|
| fastapi | 0.110+ | |
| uvicorn[standard] | 0.29+ | Start cmd: uvicorn main:app --host 0.0.0.0 --port $PORT |
| sqlalchemy | 2.x | NOT 1.x — breaking async differences |
| alembic | 1.x | |
| pydantic | 2.x | |
| pydantic-settings | 2.x | For env variable loading |
| PyJWT | 2.x | NOT python-jose |
| passlib[bcrypt] | 1.x | Password hashing |
| networkx | 3.x | Validation only — never used in production routing |
| pytest | 7.x | |
| httpx | 0.27+ | Async test client for FastAPI |
| pytest-asyncio | 0.23+ | |
| python-dotenv | 1.x | |

## Project Folder Structure
```
routeiq/
├── CLAUDE.md              ← You are here. Auto-read by Claude Code.
├── PROGRESS.md            ← Always update after each phase.
├── PRD/
│   └── RouteIQ_PRD_v2.docx
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── map/       ← MapLibre GL components
│   │   │   ├── charts/    ← ECharts components
│   │   │   ├── forms/     ← React Hook Form + Zod forms
│   │   │   └── ui/        ← Shared UI (buttons, badges, modals)
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Deliveries.tsx
│   │   │   ├── Riders.tsx
│   │   │   ├── RouteOptimization.tsx
│   │   │   └── AlgorithmComparison.tsx
│   │   ├── hooks/         ← TanStack Query hooks
│   │   ├── lib/
│   │   │   ├── axios.ts   ← Axios instance with withCredentials: true
│   │   │   └── api.ts     ← All API call functions
│   │   ├── types/         ← TypeScript interfaces
│   │   ├── schemas/       ← Zod schemas (mirror backend Pydantic models)
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/
│   ├── main.py            ← FastAPI app, CORS middleware
│   ├── config.py          ← pydantic-settings BaseSettings
│   ├── database.py        ← SQLAlchemy engine + session
│   ├── models/            ← SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── rider.py
│   │   ├── delivery.py
│   │   ├── route.py
│   │   └── algorithm_run.py
│   ├── schemas/           ← Pydantic v2 request/response schemas
│   ├── routers/           ← FastAPI routers
│   │   ├── auth.py
│   │   ├── deliveries.py
│   │   ├── riders.py
│   │   ├── routes.py
│   │   └── analytics.py
│   ├── dsa/               ← ALL algorithm implementations
│   │   ├── graph.py       ← Graph builder from GeoJSON
│   │   ├── bfs.py
│   │   ├── dfs.py
│   │   ├── dijkstra.py
│   │   ├── astar.py
│   │   ├── greedy_nn.py
│   │   ├── tsp_dp.py
│   │   ├── merge_sort.py
│   │   └── benchmark.py
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_deliveries.py
│   │   └── test_algorithms.py
│   ├── alembic/
│   ├── requirements.txt
│   ├── .env               ← NEVER commit this
│   └── .env.example       ← Commit this
└── .gitignore
```

## Critical Configuration Details

### Axios Setup (frontend/src/lib/axios.ts)
```typescript
import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,  // CRITICAL — required for httpOnly cookie auth
});
export default api;
```

### FastAPI CORS Setup (backend/main.py)
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN],  # exact Vercel URL — NOT "*"
    allow_credentials=True,               # CRITICAL — required for cookie auth
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### pydantic-settings (backend/config.py)
```python
from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24
    CORS_ORIGIN: str
    class Config:
        env_file = ".env"
settings = Settings()
```

### MapLibre GL Map Component Pattern
```typescript
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
// Always use react-map-gl/maplibre — not the default react-map-gl import
```

## DSA Implementation Rules
- Every algorithm in `/backend/dsa/` must be implemented from scratch in pure Python
- NetworkX may only be used in `benchmark.py` for correctness validation
- Every algorithm function must return: `{ route, distance, time, nodes_explored, runtime_ms }`
- The `/routes/optimize` endpoint runs all 7 algorithms and returns all results in one response

## Database
- Host: Neon PostgreSQL (connection string in .env as DATABASE_URL)
- ORM: SQLAlchemy 2.x with async sessions
- Migrations: Alembic — run `alembic upgrade head` after any model change
- Never drop tables manually — always use Alembic migrations

## Deployment
- Frontend: Vercel — connects to GitHub main branch auto-deploys
- Backend: Railway — reads requirements.txt, start command in Procfile
- DB: Neon — pass connection string as DATABASE_URL env var in Railway

## Environment Variables
### backend/.env (never commit)
```
DATABASE_URL=postgresql+asyncpg://...neon.tech/routeiq
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=https://your-app.vercel.app
```
### frontend/.env (never commit)
```
VITE_API_URL=https://your-backend.railway.app
```
