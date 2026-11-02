import { performance } from 'node:perf_hooks';
import {
  buildGraph, dijkstra, floydWarshall, reconstructDijkstraPath, reconstructFloydWarshallPath, GraphError, type Graph,
} from '../engine';
import { AppError } from '../errors';
import type { GraphDTO, GraphRepository } from '../repositories/types';

export type Algorithm = 'dijkstra' | 'floyd-warshall';

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const time = (fn: () => void, trials: number) => {
  fn(); // warm-up (JIT), not counted
  const t: number[] = [];
  for (let i = 0; i < trials; i++) { const a = performance.now(); fn(); t.push(performance.now() - a); }
  return { medianMs: median(t), minMs: Math.min(...t), maxMs: Math.max(...t), trials };
};

export function createRouteService(repo: GraphRepository) {
  async function load(graphId: string): Promise<{ dto: GraphDTO; graph: Graph }> {
    const dto = await repo.getGraph(graphId);
    if (!dto) throw new AppError(404, 'GRAPH_NOT_FOUND', `Graph ${graphId} not found`);
    return { dto, graph: buildGraph(dto) };
  }
  const requireNode = (g: Graph, id: string, label: string) => {
    if (!g.hasNode(id)) throw new AppError(404, 'NODE_NOT_FOUND', `${label} node "${id}" not found in graph`);
  };

  return {
    async shortestPath(i: { graphId: string; source: string; destination: string; algorithm: Algorithm; includeSteps: boolean }) {
      const { dto, graph } = await load(i.graphId);
      requireNode(graph, i.source, 'Source');
      requireNode(graph, i.destination, 'Destination');
      const names = new Map(dto.nodes.map((n) => [n.externalId, n.name]));
      let distance: number | null; let path: string[] | null; let steps: unknown;
      if (i.algorithm === 'dijkstra') {
        const r = dijkstra(graph, i.source, { collectSteps: i.includeSteps });
        distance = r.distances[i.destination]; path = reconstructDijkstraPath(r, i.destination); steps = r.steps;
      } else {
        const r = floydWarshall(graph, { collectSteps: i.includeSteps });
        if (r.negativeCycle) throw new AppError(422, 'NEGATIVE_CYCLE', 'Graph contains a negative cycle');
        distance = r.distances[r.nodes.indexOf(i.source)][r.nodes.indexOf(i.destination)];
        path = reconstructFloydWarshallPath(r, i.source, i.destination); steps = r.steps;
      }
      return {
        graphId: i.graphId, algorithm: i.algorithm, source: i.source, destination: i.destination,
        reachable: distance !== null, distance, path,
        pathNodes: path?.map((id) => ({ externalId: id, name: names.get(id) ?? id })) ?? null,
        ...(i.includeSteps ? { steps } : {}),
      };
    },

    async allPairs(i: { graphId: string; includeSteps: boolean }) {
      const { graph } = await load(i.graphId);
      const r = floydWarshall(graph, { collectSteps: i.includeSteps });
      return { graphId: i.graphId, ...r };
    },

    async compare(i: { graphId: string; source: string; destination: string; trials: number }) {
      const { graph } = await load(i.graphId);
      requireNode(graph, i.source, 'Source');
      requireNode(graph, i.destination, 'Destination');
      const nodes = graph.nodes();
      const fw = floydWarshall(graph);
      const fwDist = fw.distances[fw.nodes.indexOf(i.source)][fw.nodes.indexOf(i.destination)];
      const fwTiming = time(() => floydWarshall(graph), i.trials);

      let dj: unknown;
      try {
        const r = dijkstra(graph, i.source);
        dj = {
          supported: true, distance: r.distances[i.destination], path: reconstructDijkstraPath(r, i.destination),
          singleSource: time(() => dijkstra(graph, i.source), i.trials),
          allPairs: time(() => { for (const n of nodes) dijkstra(graph, n); }, i.trials),
          complexity: { time: 'O((V + E) log V) per source; O(V(V + E) log V) for all pairs', space: 'O(V)' },
        };
      } catch (e) {
        if (!(e instanceof GraphError)) throw e;
        dj = { supported: false, reason: e.message };
      }
      return {
        graphId: i.graphId, vertices: graph.nodeCount, edges: graph.edgeCount,
        dijkstra: dj,
        floydWarshall: {
          supported: true, negativeCycle: fw.negativeCycle, distance: fwDist, timing: fwTiming,
          complexity: { time: 'O(V^3)', space: 'O(V^2)' },
        },
        agree: (dj as any).supported ? (dj as any).distance === fwDist : null,
        methodology: 'Graph is loaded once; DB and HTTP time are excluded. One warm-up run, then N timed trials with performance.now(); the median is reported. "allPairs" for Dijkstra runs it from every vertex for a like-for-like comparison with Floyd-Warshall.',
      };
    },
  };
}
export type RouteService = ReturnType<typeof createRouteService>;
