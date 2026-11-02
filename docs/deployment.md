# Deployment (two Vercel projects, one GitHub repo)

## Database (Neon)
Create a project; copy the **pooled** string to `DATABASE_URL` and the **direct** string to `DATABASE_URL_UNPOOLED`. Run `npm run db:migrate` from `server/` (locally or in CI) — never on every deploy.

## Backend project
Root directory `server`. Framework preset: Other. Env vars: `DATABASE_URL`, `CORS_ORIGINS` (comma-separated frontend origins, e.g. `https://your-client.vercel.app`), `NODE_ENV=production`. `vercel.json` rewrites everything to `api/index.ts`, which exports the Express app. Verify: `GET /health`, `/api/docs`.

## Frontend project
Root directory `client`, preset Vite. Env var: `VITE_API_BASE_URL=https://your-api.vercel.app` (public value only; never put secrets in `VITE_*`). `vercel.json` provides the SPA rewrite.

## Notes
- Stateless: no filesystem or in-process state. Rate limiting is per instance (best-effort); use Redis/Upstash for strict global limits.
- Add the frontend URL to `CORS_ORIGINS` and redeploy the backend if you see CORS errors.
