import { GraphError } from './errors';

export interface Edge { source: string; target: string; weight: number }

/**
 * Weighted graph backed by an adjacency list. Pure TypeScript: no HTTP, no DB.
 * DUPLICATE EDGE POLICY: adding an edge that already exists keeps the LOWER weight
 * (parallel edges are collapsed, since only the cheapest can matter for shortest paths).
 * Undirected edges are stored in both directions.
 */
export class Graph {
  private adj = new Map<string, Map<string, number>>();
  constructor(public readonly directed = false) {}

  get nodeCount() { return this.adj.size; }
  hasNode(id: string) { return this.adj.has(id); }
  nodes(): string[] { return [...this.adj.keys()]; }

  addNode(id: string): void {
    if (!id) throw new GraphError('INVALID_INPUT', 'Node id must be a non-empty string');
    if (this.adj.has(id)) throw new GraphError('DUPLICATE_NODE', `Node "${id}" already exists`);
    this.adj.set(id, new Map());
  }

  removeNode(id: string): void {
    if (!this.adj.has(id)) throw new GraphError('NODE_NOT_FOUND', `Node "${id}" does not exist`);
    this.adj.delete(id);
    for (const out of this.adj.values()) out.delete(id);
  }

  addEdge(source: string, target: string, weight: number): void {
    if (!this.adj.has(source)) throw new GraphError('NODE_NOT_FOUND', `Edge source "${source}" does not exist`);
    if (!this.adj.has(target)) throw new GraphError('NODE_NOT_FOUND', `Edge target "${target}" does not exist`);
    if (!Number.isFinite(weight)) throw new GraphError('INVALID_WEIGHT', 'Edge weight must be a finite number');
    this.setMin(source, target, weight);
    if (!this.directed) this.setMin(target, source, weight);
  }

  removeEdge(source: string, target: string): boolean {
    const a = this.adj.get(source)?.delete(target) ?? false;
    let b = false;
    if (!this.directed) b = this.adj.get(target)?.delete(source) ?? false;
    return a || b;
  }

  hasEdge(source: string, target: string) { return this.adj.get(source)?.has(target) ?? false; }

  neighbors(id: string): [string, number][] {
    return [...(this.adj.get(id)?.entries() ?? [])];
  }

  /** Each undirected edge is reported once. */
  edges(): Edge[] {
    const out: Edge[] = [];
    const seen = new Set<string>();
    for (const [s, m] of this.adj) {
      for (const [t, w] of m) {
        if (!this.directed) {
          const key = s < t ? `${s}\u0000${t}` : `${t}\u0000${s}`;
          if (seen.has(key)) continue;
          seen.add(key);
        }
        out.push({ source: s, target: t, weight: w });
      }
    }
    return out;
  }

  get edgeCount() { return this.edges().length; }

  private setMin(s: string, t: string, w: number) {
    const m = this.adj.get(s)!;
    const cur = m.get(t);
    if (cur === undefined || w < cur) m.set(t, w);
  }
}

export interface GraphInput {
  directed: boolean;
  nodes: { externalId: string }[];
  edges: { source: string; destination: string; weight: number }[];
}

/** Build a Graph from plain data; also serves as graph validation. */
export function buildGraph(input: GraphInput): Graph {
  const g = new Graph(input.directed);
  input.nodes.forEach((n) => g.addNode(n.externalId));
  input.edges.forEach((e) => g.addEdge(e.source, e.destination, e.weight));
  return g;
}
