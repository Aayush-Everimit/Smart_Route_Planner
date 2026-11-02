import { z } from 'zod';

const uuid = z.string().uuid();
const extId = z.string().trim().min(1).max(64);
const num = z.number().finite();

export const graphIdParams = z.object({ graphId: uuid });
export const nodeParams = z.object({ graphId: uuid, nodeId: uuid });
export const edgeParams = z.object({ graphId: uuid, edgeId: uuid });

export const nodeInput = z.object({ externalId: extId, name: z.string().trim().min(1).max(100), x: num.default(0), y: num.default(0) });
export const edgeInput = z.object({ source: extId, destination: extId, weight: num });

export const createGraphBody = z.object({
  name: z.string().trim().min(1).max(100),
  directed: z.boolean().default(false),
  nodes: z.array(nodeInput).max(500).default([]),
  edges: z.array(edgeInput).max(5000).default([]),
});
export const updateGraphBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  directed: z.boolean().optional(),
  nodes: z.array(nodeInput).max(500).optional(),
  edges: z.array(edgeInput).max(5000).optional(),
}).refine((v) => Object.keys(v).length > 0, 'Provide at least one field')
  .refine((v) => !v.edges || v.nodes, { message: 'edges can only be supplied together with nodes', path: ['edges'] });

export const updateNodeBody = z.object({ name: z.string().trim().min(1).max(100).optional(), x: num.optional(), y: num.optional() })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field');

const algorithm = z.enum(['dijkstra', 'floyd-warshall']);
export const shortestPathBody = z.object({
  graphId: uuid, source: extId, destination: extId, algorithm: algorithm.default('dijkstra'), includeSteps: z.boolean().default(false),
});
export const allPairsBody = z.object({ graphId: uuid, includeSteps: z.boolean().default(false) });
export const compareBody = z.object({ graphId: uuid, source: extId, destination: extId, trials: z.number().int().min(1).max(200).default(15) });
