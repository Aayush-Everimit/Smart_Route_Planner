import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { edges, graphs, nodes } from '../db/schema';
import { AppError } from '../errors';
import type { EdgeDTO, EdgeInput, GraphDTO, GraphRepository, NodeDTO, NodeInput } from './types';

type GraphRow = typeof graphs.$inferSelect;
type NodeRow = typeof nodes.$inferSelect;
type EdgeRow = typeof edges.$inferSelect;

const nodeDTO = (n: NodeRow): NodeDTO => ({ id: n.id, externalId: n.externalNodeId, name: n.name, x: n.xPosition, y: n.yPosition });
const assemble = (g: GraphRow, ns: NodeRow[], es: EdgeRow[]): GraphDTO => {
  const ext = new Map(ns.map((n) => [n.id, n.externalNodeId]));
  return {
    id: g.id, name: g.name, directed: g.directed, createdAt: g.createdAt.toISOString(), updatedAt: g.updatedAt.toISOString(),
    nodes: ns.map(nodeDTO),
    edges: es.map((e) => ({ id: e.id, source: ext.get(e.sourceNodeId)!, destination: ext.get(e.destinationNodeId)!, weight: e.weight })),
  };
};
const pgCode = (e: any): string | undefined => e?.code ?? e?.cause?.code;
const rethrow = (e: unknown, what: string): never => {
  if (pgCode(e) === '23505') throw new AppError(409, 'CONFLICT', `${what} already exists`);
  throw e;
};

/** Build insert rows for nodes + edges with pre-generated UUIDs (neon-http has no interactive transactions; we use db.batch). */
function buildRows(graphId: string, ns: NodeInput[], es: EdgeInput[]) {
  const ids = new Map(ns.map((n) => [n.externalId, crypto.randomUUID()]));
  const nodeRows = ns.map((n) => ({ id: ids.get(n.externalId)!, graphId, externalNodeId: n.externalId, name: n.name, xPosition: n.x, yPosition: n.y }));
  const edgeRows = es.map((e) => ({ graphId, sourceNodeId: ids.get(e.source)!, destinationNodeId: ids.get(e.destination)!, weight: e.weight }));
  return { nodeRows, edgeRows };
}

export function createDrizzleGraphRepository(): GraphRepository {
  const touch = (graphId: string) => getDb().update(graphs).set({ updatedAt: new Date() }).where(eq(graphs.id, graphId));

  const repo: GraphRepository = {
    async createGraph(i) {
      const db = getDb();
      const id = crypto.randomUUID();
      const { nodeRows, edgeRows } = buildRows(id, i.nodes, i.edges);
      const ops: any[] = [db.insert(graphs).values({ id, name: i.name, directed: i.directed })];
      if (nodeRows.length) ops.push(db.insert(nodes).values(nodeRows));
      if (edgeRows.length) ops.push(db.insert(edges).values(edgeRows));
      await db.batch(ops as [any, ...any[]]);
      return (await repo.getGraph(id))!;
    },

    async listGraphs() {
      const rows = await getDb().select({
        id: graphs.id, name: graphs.name, directed: graphs.directed, createdAt: graphs.createdAt, updatedAt: graphs.updatedAt,
        nodeCount: sql<number>`(select count(*)::int from nodes where nodes.graph_id = graphs.id)`,
        edgeCount: sql<number>`(select count(*)::int from edges where edges.graph_id = graphs.id)`,
      }).from(graphs).orderBy(desc(graphs.updatedAt));
      return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }));
    },

    async getGraph(id) {
      const db = getDb();
      const [g] = await db.select().from(graphs).where(eq(graphs.id, id));
      if (!g) return null;
      const [ns, es] = await Promise.all([
        db.select().from(nodes).where(eq(nodes.graphId, id)),
        db.select().from(edges).where(eq(edges.graphId, id)),
      ]);
      return assemble(g, ns, es);
    },

    async updateGraph(id, i) {
      const db = getDb();
      if (!(await repo.graphExists(id))) return null;
      const patch: Partial<typeof graphs.$inferInsert> = { updatedAt: new Date() };
      if (i.name !== undefined) patch.name = i.name;
      if (i.directed !== undefined) patch.directed = i.directed;
      const ops: any[] = [db.update(graphs).set(patch).where(eq(graphs.id, id))];
      if (i.nodes) {
        const { nodeRows, edgeRows } = buildRows(id, i.nodes, i.edges ?? []);
        ops.push(db.delete(edges).where(eq(edges.graphId, id)), db.delete(nodes).where(eq(nodes.graphId, id)));
        if (nodeRows.length) ops.push(db.insert(nodes).values(nodeRows));
        if (edgeRows.length) ops.push(db.insert(edges).values(edgeRows));
      }
      await db.batch(ops as [any, ...any[]]);
      return repo.getGraph(id);
    },

    async deleteGraph(id) {
      const r = await getDb().delete(graphs).where(eq(graphs.id, id)).returning({ id: graphs.id });
      return r.length > 0;
    },

    async graphExists(id) {
      const r = await getDb().select({ id: graphs.id }).from(graphs).where(eq(graphs.id, id));
      return r.length > 0;
    },

    async createNode(graphId, i) {
      try {
        const [n] = await getDb().insert(nodes).values({ graphId, externalNodeId: i.externalId, name: i.name, xPosition: i.x, yPosition: i.y }).returning();
        await touch(graphId);
        return nodeDTO(n);
      } catch (e) { return rethrow(e, `Node "${i.externalId}"`); }
    },

    async listNodes(graphId) {
      return (await getDb().select().from(nodes).where(eq(nodes.graphId, graphId))).map(nodeDTO);
    },

    async updateNode(graphId, nodeId, i) {
      const patch: Partial<typeof nodes.$inferInsert> = {};
      if (i.name !== undefined) patch.name = i.name;
      if (i.x !== undefined) patch.xPosition = i.x;
      if (i.y !== undefined) patch.yPosition = i.y;
      if (!Object.keys(patch).length) {
        const [n] = await getDb().select().from(nodes).where(and(eq(nodes.id, nodeId), eq(nodes.graphId, graphId)));
        return n ? nodeDTO(n) : null;
      }
      const [n] = await getDb().update(nodes).set(patch).where(and(eq(nodes.id, nodeId), eq(nodes.graphId, graphId))).returning();
      if (n) await touch(graphId);
      return n ? nodeDTO(n) : null;
    },

    async deleteNode(graphId, nodeId) {
      const r = await getDb().delete(nodes).where(and(eq(nodes.id, nodeId), eq(nodes.graphId, graphId))).returning({ id: nodes.id });
      if (r.length) await touch(graphId);
      return r.length > 0;
    },

    async createEdge(graphId, i) {
      const db = getDb();
      const found = await db.select().from(nodes).where(and(eq(nodes.graphId, graphId), inArray(nodes.externalNodeId, [i.source, i.destination])));
      const s = found.find((n) => n.externalNodeId === i.source), d = found.find((n) => n.externalNodeId === i.destination);
      if (!s) throw new AppError(404, 'NODE_NOT_FOUND', `Node "${i.source}" not found in graph`);
      if (!d) throw new AppError(404, 'NODE_NOT_FOUND', `Node "${i.destination}" not found in graph`);
      try {
        const [e] = await db.insert(edges).values({ graphId, sourceNodeId: s.id, destinationNodeId: d.id, weight: i.weight }).returning();
        await touch(graphId);
        return { id: e.id, source: i.source, destination: i.destination, weight: e.weight } as EdgeDTO;
      } catch (e) { return rethrow(e, 'Edge'); }
    },

    async listEdges(graphId) {
      const g = await repo.getGraph(graphId);
      return g?.edges ?? [];
    },

    async deleteEdge(graphId, edgeId) {
      const r = await getDb().delete(edges).where(and(eq(edges.id, edgeId), eq(edges.graphId, graphId))).returning({ id: edges.id });
      if (r.length) await touch(graphId);
      return r.length > 0;
    },
  };
  return repo;
}
