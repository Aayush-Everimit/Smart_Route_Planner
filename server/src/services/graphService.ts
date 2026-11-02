import { buildGraph } from '../engine';
import { AppError } from '../errors';
import type { EdgeInput, GraphRepository, NodeInput } from '../repositories/types';

export function createGraphService(repo: GraphRepository) {
  const ensure = async (graphId: string) => {
    if (!(await repo.graphExists(graphId))) throw new AppError(404, 'GRAPH_NOT_FOUND', `Graph ${graphId} not found`);
  };
  const validate = (directed: boolean, nodes: NodeInput[], edges: EdgeInput[]) => buildGraph({ directed, nodes, edges }); // throws GraphError

  return {
    async create(i: { name: string; directed: boolean; nodes: NodeInput[]; edges: EdgeInput[] }) {
      validate(i.directed, i.nodes, i.edges);
      return repo.createGraph(i);
    },
    list: () => repo.listGraphs(),
    async get(id: string) {
      const g = await repo.getGraph(id);
      if (!g) throw new AppError(404, 'GRAPH_NOT_FOUND', `Graph ${id} not found`);
      return g;
    },
    async update(id: string, i: { name?: string; directed?: boolean; nodes?: NodeInput[]; edges?: EdgeInput[] }) {
      const current = await this.get(id);
      const directed = i.directed ?? current.directed;
      if (i.nodes) validate(directed, i.nodes, i.edges ?? []);
      const g = await repo.updateGraph(id, i);
      if (!g) throw new AppError(404, 'GRAPH_NOT_FOUND', `Graph ${id} not found`);
      return g;
    },
    async remove(id: string) {
      if (!(await repo.deleteGraph(id))) throw new AppError(404, 'GRAPH_NOT_FOUND', `Graph ${id} not found`);
    },
    async createNode(graphId: string, i: NodeInput) { await ensure(graphId); return repo.createNode(graphId, i); },
    async listNodes(graphId: string) { await ensure(graphId); return repo.listNodes(graphId); },
    async updateNode(graphId: string, nodeId: string, i: Partial<Omit<NodeInput, 'externalId'>>) {
      await ensure(graphId);
      const n = await repo.updateNode(graphId, nodeId, i);
      if (!n) throw new AppError(404, 'NODE_NOT_FOUND', `Node ${nodeId} not found`);
      return n;
    },
    async removeNode(graphId: string, nodeId: string) {
      await ensure(graphId);
      if (!(await repo.deleteNode(graphId, nodeId))) throw new AppError(404, 'NODE_NOT_FOUND', `Node ${nodeId} not found`);
    },
    async createEdge(graphId: string, i: EdgeInput) { await ensure(graphId); return repo.createEdge(graphId, i); },
    async listEdges(graphId: string) { await ensure(graphId); return repo.listEdges(graphId); },
    async removeEdge(graphId: string, edgeId: string) {
      await ensure(graphId);
      if (!(await repo.deleteEdge(graphId, edgeId))) throw new AppError(404, 'EDGE_NOT_FOUND', `Edge ${edgeId} not found`);
    },
  };
}
export type GraphService = ReturnType<typeof createGraphService>;
