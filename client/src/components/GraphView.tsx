import { ReactFlow, Background, Controls, MarkerType, type Edge, type Node } from '@xyflow/react';
import { useMemo } from 'react';
import type { GraphDTO } from '../types/api';

interface Props {
  graph: GraphDTO; path?: string[] | null; current?: string; visited?: string[];
  relaxed?: { from: string; to: string; improved: boolean }[]; distances?: Record<string, number | null>; height?: number;
}

/** Read-only graph rendering with algorithm highlighting. */
export function GraphView({ graph, path, current, visited, relaxed, distances, height = 380 }: Props) {
  const { nodes, edges } = useMemo(() => {
    const onPath = new Set(path ?? []);
    const pathEdges = new Set<string>();
    (path ?? []).forEach((n, i) => { const m = path![i + 1]; if (m) { pathEdges.add(`${n}>${m}`); if (!graph.directed) pathEdges.add(`${m}>${n}`); } });
    const rel = new Map<string, boolean>();
    (relaxed ?? []).forEach((r) => { rel.set(`${r.from}>${r.to}`, r.improved); if (!graph.directed) rel.set(`${r.to}>${r.from}`, r.improved); });
    const vis = new Set(visited ?? []);
    const ns: Node[] = graph.nodes.map((n) => {
      const bg = n.externalId === current ? '#f59e0b' : onPath.has(n.externalId) ? '#6366f1' : vis.has(n.externalId) ? '#a7f3d0' : '#fff';
      const d = distances?.[n.externalId];
      return {
        id: n.externalId, position: { x: n.x, y: n.y }, draggable: false,
        data: { label: distances ? `${n.name}  [${d === null || d === undefined ? '∞' : d}]` : n.name },
        style: { background: bg, color: bg === '#6366f1' || bg === '#f59e0b' ? '#fff' : '#0f172a', border: '1.5px solid #64748b', borderRadius: 10, fontSize: 12 },
      };
    });
    const es: Edge[] = graph.edges.map((e) => {
      const k = `${e.source}>${e.destination}`;
      const inPath = pathEdges.has(k);
      const r = rel.get(k);
      return {
        id: e.id, source: e.source, target: e.destination, label: String(e.weight), animated: r !== undefined,
        markerEnd: graph.directed ? { type: MarkerType.ArrowClosed } : undefined,
        style: { stroke: inPath ? '#6366f1' : r === true ? '#16a34a' : r === false ? '#f59e0b' : '#94a3b8', strokeWidth: inPath ? 3.5 : 2 },
      };
    });
    return { nodes: ns, edges: es };
  }, [graph, path, current, visited, relaxed, distances]);

  return (
    <div className="card overflow-hidden p-0" style={{ height }} data-testid="graph-view">
      <ReactFlow nodes={nodes} edges={edges} fitView nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }}>
        <Background /><Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
