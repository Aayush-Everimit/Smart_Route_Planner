# Architecture

Modular monolith. The engine (`server/src/engine`) works on plain TypeScript structures and imports nothing from Express, Drizzle or the client.

- **Routes** declare paths + validation (Zod). **Controllers** translate HTTP ↔ service calls. **Services** hold business rules (existence checks, graph validation via the engine, benchmarking). **Repositories** (`GraphRepository` interface) own persistence; production uses Drizzle + Neon HTTP, tests use an in-memory double.
- Request flow: Router → Controller → Service → Repository → Graph Engine → Response DTO.
- **Identifiers**: clients and route requests use `externalId` (stable, human-chosen) for nodes; node/edge management URLs use database UUIDs. Frontend node positions live in `nodes.x_position/y_position`, never in the engine.
- **Persistence on serverless**: neon-http has no interactive transactions, so multi-statement writes use `db.batch` (atomic) with UUIDs generated up front. No in-memory state is kept between requests.
- **Errors**: `AppError` (HTTP), `GraphError` (engine) and `ZodError` map to `{ success:false, error:{ code, message, details? } }`; unknown errors become a generic 500 without stack traces.
- **Duplicate policy**: engine collapses parallel edges keeping the lowest weight; the database rejects duplicate (graph, source, destination) edges with 409.
