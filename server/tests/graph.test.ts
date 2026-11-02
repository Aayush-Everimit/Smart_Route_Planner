import { describe, it, expect } from 'vitest';
import { Graph, GraphError, buildGraph } from '../src/engine';

describe('Graph', () => {
  const mk = (directed = false) => { const g = new Graph(directed); ['A', 'B', 'C'].forEach((n) => g.addNode(n)); return g; };
  it('adds nodes and edges', () => { const g = mk(); g.addEdge('A', 'B', 2); expect(g.hasEdge('A', 'B')).toBe(true); expect(g.edgeCount).toBe(1); });
  it('rejects duplicate nodes', () => expect(() => mk().addNode('A')).toThrow(GraphError));
  it('rejects invalid endpoints', () => expect(() => mk().addEdge('A', 'Z', 1)).toThrow(/does not exist/));
  it('rejects non-finite weights', () => expect(() => mk().addEdge('A', 'B', NaN)).toThrow(GraphError));
  it('undirected edges are bidirectional, directed are not', () => {
    const u = mk(false); u.addEdge('A', 'B', 1); expect(u.hasEdge('B', 'A')).toBe(true);
    const d = mk(true); d.addEdge('A', 'B', 1); expect(d.hasEdge('B', 'A')).toBe(false);
  });
  it('duplicate edge keeps the lower weight', () => { const g = mk(); g.addEdge('A', 'B', 5); g.addEdge('A', 'B', 3); g.addEdge('A', 'B', 9); expect(g.neighbors('A')).toEqual([['B', 3]]); });
  it('removes edges', () => { const g = mk(); g.addEdge('A', 'B', 1); expect(g.removeEdge('A', 'B')).toBe(true); expect(g.hasEdge('B', 'A')).toBe(false); });
  it('removes nodes and incident edges', () => { const g = mk(); g.addEdge('A', 'B', 1); g.removeNode('B'); expect(g.neighbors('A')).toEqual([]); expect(() => g.removeNode('B')).toThrow(GraphError); });
  it('supports disconnected graphs', () => { const g = mk(); g.addEdge('A', 'B', 1); expect(g.neighbors('C')).toEqual([]); });
  it('buildGraph validates input', () => expect(() => buildGraph({ directed: false, nodes: [{ externalId: 'A' }], edges: [{ source: 'A', destination: 'B', weight: 1 }] })).toThrow(GraphError));
});
