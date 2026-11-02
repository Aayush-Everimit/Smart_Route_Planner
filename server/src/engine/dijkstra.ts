import { Graph } from './graph';
import { GraphError } from './errors';
import { MinHeap } from './minHeap';

export interface DijkstraStep {
  current: string;
  distances: Record<string, number | null>; // null = Infinity (unreached)
  queue: { node: string; distance: number }[];
  relaxed: { from: string; to: string; weight: number; improved: boolean }[];
  visited: string[];
}

/** Single-source result. */
export interface SingleSourceResult {
  algorithm: 'dijkstra';
  source: string;
  distances: Record<string, number | null>;
  previous: Record<string, string | null>;
  visitOrder: string[];
  steps?: DijkstraStep[];
}

const fin = (n: number) => (Number.isFinite(n) ? n : null);

/**
 * Dijkstra with a binary heap and lazy deletion: O((V + E) log V).
 * Tie-break: when two paths have equal length, the one discovered first is kept (strict '<' relaxation).
 */
export function dijkstra(graph: Graph, source: string, opts: { collectSteps?: boolean } = {}): SingleSourceResult {
  if (!graph.hasNode(source)) throw new GraphError('NODE_NOT_FOUND', `Source "${source}" does not exist`);
  for (const e of graph.edges()) {
    if (e.weight < 0) throw new GraphError('NEGATIVE_WEIGHT', 'Dijkstra does not support negative edge weights');
  }
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const n of graph.nodes()) { dist.set(n, Infinity); prev.set(n, null); }
  dist.set(source, 0);

  const heap = new MinHeap<string>();
  heap.push(0, source);
  const visited = new Set<string>();
  const order: string[] = [];
  const steps: DijkstraStep[] = [];
  const snap = () => Object.fromEntries([...dist].map(([k, v]) => [k, fin(v)]));

  while (heap.size) {
    const { k: d, v: u } = heap.pop()!;
    if (visited.has(u) || d > dist.get(u)!) continue; // stale entry
    visited.add(u);
    order.push(u);
    const relaxed: DijkstraStep['relaxed'] = [];
    for (const [v, w] of graph.neighbors(u)) {
      if (visited.has(v)) continue;
      const nd = d + w;
      const improved = nd < dist.get(v)!;
      if (improved) { dist.set(v, nd); prev.set(v, u); heap.push(nd, v); }
      relaxed.push({ from: u, to: v, weight: w, improved });
    }
    if (opts.collectSteps) {
      steps.push({
        current: u,
        distances: snap(),
        queue: heap.snapshot().filter((e) => !visited.has(e.v) && e.k <= dist.get(e.v)!).map((e) => ({ node: e.v, distance: e.k })),
        relaxed,
        visited: [...visited],
      });
    }
  }
  return {
    algorithm: 'dijkstra', source, distances: snap(), previous: Object.fromEntries(prev), visitOrder: order,
    ...(opts.collectSteps ? { steps } : {}),
  };
}

export function reconstructDijkstraPath(r: SingleSourceResult, target: string): string[] | null {
  if (!(target in r.distances) || r.distances[target] === null) return null;
  const path: string[] = [];
  for (let c: string | null = target; c !== null; c = r.previous[c]) path.push(c);
  return path.reverse();
}
