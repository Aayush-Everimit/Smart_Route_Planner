// TEST DOUBLE ONLY — never imported by production code.
import { AppError } from '../../src/errors';
import type { GraphRepository, GraphDTO, NodeDTO, EdgeDTO } from '../../src/repositories/types';

export function createInMemoryRepo(): GraphRepository & { failNext(): void } {
  const store = new Map<string, GraphDTO>();
  let fail = false;
  const guard = () => { if (fail) { fail = false; throw new Error('db down'); } };
  const now = () => new Date().toISOString();
  const uid = () => crypto.randomUUID();
  const mk = (id: string, i: any): GraphDTO => ({
    id, name: i.name, directed: i.directed, createdAt: now(), updatedAt: now(),
    nodes: (i.nodes ?? []).map((n: any) => ({ id: uid(), ...n })),
    edges: (i.edges ?? []).map((e: any) => ({ id: uid(), ...e })),
  });
  return {
    failNext() { fail = true; },
    async createGraph(i) { guard(); const g = mk(uid(), i); store.set(g.id, g); return g; },
    async listGraphs() { guard(); return [...store.values()].map((g) => ({ id: g.id, name: g.name, directed: g.directed, createdAt: g.createdAt, updatedAt: g.updatedAt, nodeCount: g.nodes.length, edgeCount: g.edges.length })); },
    async getGraph(id) { guard(); return store.get(id) ?? null; },
    async updateGraph(id, i) {
      const g = store.get(id); if (!g) return null;
      const n = { ...g, ...(i.name !== undefined && { name: i.name }), ...(i.directed !== undefined && { directed: i.directed }) };
      if (i.nodes) { const r = mk(id, { ...n, nodes: i.nodes, edges: i.edges ?? [] }); n.nodes = r.nodes; n.edges = r.edges; }
      store.set(id, n); return n;
    },
    async deleteGraph(id) { return store.delete(id); },
    async graphExists(id) { return store.has(id); },
    async createNode(gid, i) {
      const g = store.get(gid)!;
      if (g.nodes.some((n) => n.externalId === i.externalId)) throw new AppError(409, 'CONFLICT', 'Node already exists');
      const n: NodeDTO = { id: uid(), ...i }; g.nodes.push(n); return n;
    },
    async listNodes(gid) { return store.get(gid)!.nodes; },
    async updateNode(gid, nid, i) { const n = store.get(gid)!.nodes.find((x) => x.id === nid); if (!n) return null; Object.assign(n, i); return n; },
    async deleteNode(gid, nid) {
      const g = store.get(gid)!; const n = g.nodes.find((x) => x.id === nid); if (!n) return false;
      g.nodes = g.nodes.filter((x) => x !== n); g.edges = g.edges.filter((e) => e.source !== n.externalId && e.destination !== n.externalId); return true;
    },
    async createEdge(gid, i) {
      const g = store.get(gid)!;
      for (const x of [i.source, i.destination]) if (!g.nodes.some((n) => n.externalId === x)) throw new AppError(404, 'NODE_NOT_FOUND', `Node "${x}" not found in graph`);
      const e: EdgeDTO = { id: uid(), ...i }; g.edges.push(e); return e;
    },
    async listEdges(gid) { return store.get(gid)!.edges; },
    async deleteEdge(gid, eid) { const g = store.get(gid)!; const l = g.edges.length; g.edges = g.edges.filter((e) => e.id !== eid); return g.edges.length < l; },
  };
}
