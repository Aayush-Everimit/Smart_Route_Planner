import { asyncHandler } from '../middleware/errorHandler';
import type { GraphService } from '../services/graphService';

const ok = (data: unknown) => ({ success: true, data });

export function createGraphController(s: GraphService) {
  return {
    create: asyncHandler(async (req, res) => { res.status(201).json(ok(await s.create(req.body))); }),
    list: asyncHandler(async (_req, res) => { res.json(ok(await s.list())); }),
    get: asyncHandler(async (req, res) => { res.json(ok(await s.get(req.params.graphId))); }),
    update: asyncHandler(async (req, res) => { res.json(ok(await s.update(req.params.graphId, req.body))); }),
    remove: asyncHandler(async (req, res) => { await s.remove(req.params.graphId); res.status(204).end(); }),
    createNode: asyncHandler(async (req, res) => { res.status(201).json(ok(await s.createNode(req.params.graphId, req.body))); }),
    listNodes: asyncHandler(async (req, res) => { res.json(ok(await s.listNodes(req.params.graphId))); }),
    updateNode: asyncHandler(async (req, res) => { res.json(ok(await s.updateNode(req.params.graphId, req.params.nodeId, req.body))); }),
    removeNode: asyncHandler(async (req, res) => { await s.removeNode(req.params.graphId, req.params.nodeId); res.status(204).end(); }),
    createEdge: asyncHandler(async (req, res) => { res.status(201).json(ok(await s.createEdge(req.params.graphId, req.body))); }),
    listEdges: asyncHandler(async (req, res) => { res.json(ok(await s.listEdges(req.params.graphId))); }),
    removeEdge: asyncHandler(async (req, res) => { await s.removeEdge(req.params.graphId, req.params.edgeId); res.status(204).end(); }),
  };
}

import type { RouteService } from '../services/routeService';
export function createRouteController(s: RouteService) {
  return {
    shortestPath: asyncHandler(async (req, res) => { res.json(ok(await s.shortestPath(req.body))); }),
    allPairs: asyncHandler(async (req, res) => { res.json(ok(await s.allPairs(req.body))); }),
    compare: asyncHandler(async (req, res) => { res.json(ok(await s.compare(req.body))); }),
  };
}
