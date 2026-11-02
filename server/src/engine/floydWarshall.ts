import { Graph } from './graph';
import { GraphError } from './errors';

export interface FloydWarshallStep {
  k: number;
  kNode: string;
  matrix: (number | null)[][]; // matrix AFTER processing intermediate vertex k
  updated: [number, number][];
}

/** All-pairs result. `distances[i][j]` is null when j is unreachable from i. */
export interface AllPairsResult {
  algorithm: 'floyd-warshall';
  nodes: string[];
  distances: (number | null)[][];
  next: (number | null)[][]; // next-hop matrix (indices into `nodes`)
  negativeCycle: boolean;
  steps?: FloydWarshallStep[];
}

const fin = (n: number) => (Number.isFinite(n) ? n : null);

/** Floyd-Warshall: O(V^3) time, O(V^2) space. Supports negative edges, detects negative cycles. */
export function floydWarshall(graph: Graph, opts: { collectSteps?: boolean } = {}): AllPairsResult {
  const nodes = graph.nodes();
  const n = nodes.length;
  const idx = new Map(nodes.map((id, i) => [id, i]));
  const dist = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  const next: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
  for (let i = 0; i < n; i++) next[i][i] = i;
  for (const e of graph.edges()) {
    const pairs: [string, string][] = graph.directed ? [[e.source, e.target]] : [[e.source, e.target], [e.target, e.source]];
    for (const [s, t] of pairs) {
      const i = idx.get(s)!, j = idx.get(t)!;
      if (i === j) { if (e.weight < dist[i][i]) dist[i][i] = e.weight; continue; } // self-loop
      if (e.weight < dist[i][j]) { dist[i][j] = e.weight; next[i][j] = j; }
    }
  }
  const steps: FloydWarshallStep[] = [];
  for (let k = 0; k < n; k++) {
    const updated: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      if (dist[i][k] === Infinity) continue;
      for (let j = 0; j < n; j++) {
        if (dist[k][j] === Infinity) continue;
        const through = dist[i][k] + dist[k][j];
        if (through < dist[i][j]) { dist[i][j] = through; next[i][j] = next[i][k]; updated.push([i, j]); }
      }
    }
    if (opts.collectSteps) steps.push({ k, kNode: nodes[k], matrix: dist.map((r) => r.map(fin)), updated });
  }
  const negativeCycle = dist.some((row, i) => row[i] < 0);
  return {
    algorithm: 'floyd-warshall', nodes, distances: dist.map((r) => r.map(fin)), next, negativeCycle,
    ...(opts.collectSteps ? { steps } : {}),
  };
}

export function reconstructFloydWarshallPath(r: AllPairsResult, source: string, target: string): string[] | null {
  if (r.negativeCycle) throw new GraphError('NEGATIVE_CYCLE', 'Graph contains a negative cycle; paths are undefined');
  const i = r.nodes.indexOf(source), j = r.nodes.indexOf(target);
  if (i < 0 || j < 0) throw new GraphError('NODE_NOT_FOUND', 'Unknown source or target');
  if (r.distances[i][j] === null) return null;
  const path = [source];
  let c = i;
  while (c !== j) {
    const nx = r.next[c][j];
    if (nx === null) return null;
    c = nx;
    path.push(r.nodes[c]);
  }
  return path;
}
