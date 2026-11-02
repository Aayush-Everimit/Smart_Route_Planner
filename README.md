# Smart Route Planner & Navigator

Weighted-graph routing with **Dijkstra** and **Floyd-Warshall**, implemented from scratch, exposed as a versioned REST API (`/api/v1`) and a React frontend. Built as a DSA project **and** as a standalone routing service that RideFlow can call over HTTP.

## Features
- Graph editor (React Flow): add/delete/drag nodes, connect edges, edit weights, directed/undirected, JSON import/export, save to DB
- Shortest path (Dijkstra or Floyd-Warshall) on persisted graphs, route highlighted on canvas
- Step-by-step visualizer (play / pause / next / previous / reset): Dijkstra (current node, distances, priority queue, relaxed edges) and Floyd-Warshall (matrix, intermediate k, updated cells, path reconstruction)
- Algorithm comparison: median-of-N timings, complexity table, bar chart, methodology
- OpenAPI docs at `/api/docs`, Helmet, CORS allowlist, Zod validation, rate limits, safe errors

## Architecture
```
HTTP → Express Router → Controller → Service → Repository (Drizzle/Neon) ─┐
                                         └──────────→ Graph Engine (pure TS) ←┘ → Response DTO
```
```
client/  React + Vite + Tailwind + Zustand + React Flow
server/
  api/index.ts        Vercel entry (exports the Express app)
  src/engine/         Graph, MinHeap, dijkstra, floydWarshall  (no Express/DB imports)
  src/routes|controllers|services|repositories|validators|middleware|db|config
  drizzle/            generated SQL migrations
```
Details: [docs/architecture.md](docs/architecture.md), [docs/algorithms.md](docs/algorithms.md), [docs/api-contract.md](docs/api-contract.md), [docs/deployment.md](docs/deployment.md).

## Setup
```bash
# server
cd server && cp .env.example .env     # fill DATABASE_URL (pooled) + DATABASE_URL_UNPOOLED (direct)
npm install
npm run db:migrate                     # applies drizzle/ migrations using the direct URL
npm run dev                            # http://localhost:4000  (docs: /api/docs)

# client
cd client && cp .env.example .env      # VITE_API_BASE_URL=http://localhost:4000
npm install && npm run dev             # http://localhost:5173
```
After changing `server/src/db/schema.ts`: `npm run db:generate`, review the SQL, then `npm run db:migrate`. Migrations are never run automatically in production.

## Testing
`cd server && npm test` (engine + API via Supertest, using a test-only in-memory repository) · `cd client && npm test` (React Testing Library).

## Example requests
```bash
curl -X POST $API/api/v1/graphs -H 'content-type: application/json' -d '{
 "name":"Demo","directed":false,
 "nodes":[{"externalId":"A","name":"A","x":0,"y":0},{"externalId":"B","name":"B","x":100,"y":0},{"externalId":"C","name":"C","x":200,"y":0}],
 "edges":[{"source":"A","destination":"B","weight":1},{"source":"B","destination":"C","weight":2}]}'

curl -X POST $API/api/v1/routes/shortest-path -H 'content-type: application/json' \
 -d '{"graphId":"<id>","source":"A","destination":"C","algorithm":"dijkstra"}'
```

## Complexity
Dijkstra (binary heap, adjacency list): O((V+E) log V), O(V). Floyd-Warshall: O(V³), O(V²).

## Future improvements
Authentication / graph ownership, coordinate-based nodes with geo distance, A* routing, Redis-backed global rate limiting, route-calculation history table, e2e tests (Playwright), pagination for large graphs.
