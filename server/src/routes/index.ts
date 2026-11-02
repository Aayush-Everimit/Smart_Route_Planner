import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createGraphController, createRouteController } from '../controllers/graphController';
import { validate } from '../middleware/validate';
import * as v from '../validators/schemas';
import type { GraphService } from '../services/graphService';
import type { RouteService } from '../services/routeService';

export function createApiRouter(graphs: GraphService, routes: RouteService) {
  const r = Router();
  const g = createGraphController(graphs);
  const c = createRouteController(routes);
  // NOTE: in-memory limiter is per serverless instance (best-effort). Use Upstash/Redis for strict global limits.
  const heavy = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false });

  r.post('/graphs', validate({ body: v.createGraphBody }), g.create);
  r.get('/graphs', g.list);
  r.get('/graphs/:graphId', validate({ params: v.graphIdParams }), g.get);
  r.put('/graphs/:graphId', validate({ params: v.graphIdParams, body: v.updateGraphBody }), g.update);
  r.delete('/graphs/:graphId', validate({ params: v.graphIdParams }), g.remove);

  r.post('/graphs/:graphId/nodes', validate({ params: v.graphIdParams, body: v.nodeInput }), g.createNode);
  r.get('/graphs/:graphId/nodes', validate({ params: v.graphIdParams }), g.listNodes);
  r.put('/graphs/:graphId/nodes/:nodeId', validate({ params: v.nodeParams, body: v.updateNodeBody }), g.updateNode);
  r.delete('/graphs/:graphId/nodes/:nodeId', validate({ params: v.nodeParams }), g.removeNode);

  r.post('/graphs/:graphId/edges', validate({ params: v.graphIdParams, body: v.edgeInput }), g.createEdge);
  r.get('/graphs/:graphId/edges', validate({ params: v.graphIdParams }), g.listEdges);
  r.delete('/graphs/:graphId/edges/:edgeId', validate({ params: v.edgeParams }), g.removeEdge);

  r.post('/routes/shortest-path', heavy, validate({ body: v.shortestPathBody }), c.shortestPath);
  r.post('/routes/all-pairs', heavy, validate({ body: v.allPairsBody }), c.allPairs);
  r.post('/routes/compare', heavy, validate({ body: v.compareBody }), c.compare);
  return r;
}
