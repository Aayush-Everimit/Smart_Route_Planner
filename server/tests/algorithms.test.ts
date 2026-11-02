import { describe, it, expect } from 'vitest';
import { Graph, dijkstra, floydWarshall, reconstructDijkstraPath, reconstructFloydWarshallPath, GraphError } from '../src/engine';

const build = (directed: boolean, nodes: string[], edges: [string, string, number][]) => {
  const g = new Graph(directed); nodes.forEach((n) => g.addNode(n)); edges.forEach(([a, b, w]) => g.addEdge(a, b, w)); return g;
};
const normal = () => build(false, ['A', 'B', 'C', 'D', 'E'], [['A', 'B', 4], ['A', 'C', 1], ['C', 'B', 2], ['B', 'D', 1], ['C', 'D', 5]]);

describe('Dijkstra', () => {
  it('finds shortest distances and path', () => {
    const r = dijkstra(normal(), 'A');
    expect(r.distances).toMatchObject({ A: 0, C: 1, B: 3, D: 4 });
    expect(reconstructDijkstraPath(r, 'D')).toEqual(['A', 'C', 'B', 'D']);
  });
  it('handles equal-length alternatives (distance is the same)', () => {
    const g = build(false, ['S', 'X', 'Y', 'T'], [['S', 'X', 1], ['S', 'Y', 1], ['X', 'T', 1], ['Y', 'T', 1]]);
    const r = dijkstra(g, 'S'); expect(r.distances.T).toBe(2); expect(reconstructDijkstraPath(r, 'T')).toHaveLength(3);
  });
  it('handles disconnected destination', () => { const r = dijkstra(normal(), 'A'); expect(r.distances.E).toBeNull(); expect(reconstructDijkstraPath(r, 'E')).toBeNull(); });
  it('handles single node graph', () => { const r = dijkstra(build(false, ['A'], []), 'A'); expect(r.distances.A).toBe(0); expect(reconstructDijkstraPath(r, 'A')).toEqual(['A']); });
  it('rejects negative weights', () => expect(() => dijkstra(build(true, ['A', 'B'], [['A', 'B', -1]]), 'A')).toThrow(GraphError));
  it('rejects unknown source', () => expect(() => dijkstra(normal(), 'Z')).toThrow(GraphError));
  it('only emits steps when requested', () => {
    expect(dijkstra(normal(), 'A').steps).toBeUndefined();
    const s = dijkstra(normal(), 'A', { collectSteps: true }).steps!;
    expect(s[0].current).toBe('A'); expect(s.at(-1)!.visited).toHaveLength(4);
  });
});

describe('Floyd-Warshall', () => {
  it('computes all-pairs distances matching Dijkstra', () => {
    const g = normal(); const fw = floydWarshall(g);
    for (const s of g.nodes()) {
      const d = dijkstra(g, s);
      for (const t of g.nodes()) expect(fw.distances[fw.nodes.indexOf(s)][fw.nodes.indexOf(t)]).toBe(d.distances[t]);
    }
  });
  it('reconstructs paths', () => expect(reconstructFloydWarshallPath(floydWarshall(normal()), 'A', 'D')).toEqual(['A', 'C', 'B', 'D']));
  it('supports negative edges (directed)', () => {
    const fw = floydWarshall(build(true, ['A', 'B', 'C'], [['A', 'B', 4], ['A', 'C', 5], ['C', 'B', -3]]));
    expect(fw.negativeCycle).toBe(false); expect(fw.distances[0][1]).toBe(2);
    expect(reconstructFloydWarshallPath(fw, 'A', 'B')).toEqual(['A', 'C', 'B']);
  });
  it('detects negative cycles', () => {
    const fw = floydWarshall(build(true, ['A', 'B', 'C'], [['A', 'B', 1], ['B', 'C', -3], ['C', 'A', 1]]));
    expect(fw.negativeCycle).toBe(true);
    expect(() => reconstructFloydWarshallPath(fw, 'A', 'B')).toThrow(GraphError);
  });
  it('handles disconnected graphs', () => { const fw = floydWarshall(normal()); expect(fw.distances[0][4]).toBeNull(); expect(reconstructFloydWarshallPath(fw, 'A', 'E')).toBeNull(); });
  it('emits per-k steps with updated cells when requested', () => {
    const fw = floydWarshall(normal(), { collectSteps: true });
    expect(fw.steps).toHaveLength(5); expect(fw.steps!.some((s) => s.updated.length > 0)).toBe(true);
  });
});
