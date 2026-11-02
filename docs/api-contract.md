# API contract (`/api/v1`)

Success: `{ "success": true, "data": ... }` · Failure: `{ "success": false, "error": { "code", "message", "details?" } }`. Interactive docs: `/api/docs`, spec: `/api/openapi.json`.

| Method | Path | Notes |
|---|---|---|
| POST/GET | `/graphs` | create (optionally with nodes+edges) / list summaries |
| GET/PUT/DELETE | `/graphs/:graphId` | PUT with `nodes` replaces contents |
| POST/GET | `/graphs/:graphId/nodes` | body `{externalId,name,x,y}`; 409 on duplicate externalId |
| PUT/DELETE | `/graphs/:graphId/nodes/:nodeId` | `nodeId` = UUID |
| POST/GET | `/graphs/:graphId/edges` | body `{source,destination,weight}` using external ids |
| DELETE | `/graphs/:graphId/edges/:edgeId` | |
| POST | `/routes/shortest-path` | `{graphId,source,destination,algorithm?,includeSteps?}` → `{reachable,distance,path,pathNodes}` |
| POST | `/routes/all-pairs` | `{graphId,includeSteps?}` → distance + next-hop matrices, `negativeCycle` |
| POST | `/routes/compare` | `{graphId,source,destination,trials?}` |
| GET | `/health` | liveness |

Status codes: 200/201/204 success · 400 validation · 404 missing graph/node/edge · 409 duplicate · 413 payload too large · 422 negative cycle · 429 rate limited · 500 internal.

**RideFlow usage**: create (or reuse) a graph once, then call `POST /routes/shortest-path` with the stored `graphId` and external node ids. Never send the whole graph per request. Server-to-server calls need no CORS configuration.
