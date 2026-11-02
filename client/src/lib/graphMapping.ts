import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { GraphPayload } from '../types/api';

type Src = { nodes: { externalId: string; name: string; x: number; y: number }[]; edges: { id: string; source: string; destination: string; weight: number }[]; directed?: boolean };

/** API graph → React Flow shapes. Weights/ids live in `data`; positions stay in Flow node.position. */
export function toFlow(g: Src): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: g.nodes.map((n) => ({ id: n.externalId, position: { x: n.x, y: n.y }, data: { label: n.name } })),
    edges: g.edges.map((e) => ({ id: e.id, source: e.source, target: e.destination, label: String(e.weight), data: { weight: e.weight } })),
  };
}
export function toPayload(name: string, directed: boolean, nodes: Node[], edges: Edge[]): GraphPayload {
  return {
    name, directed,
    nodes: nodes.map((n) => ({ externalId: n.id, name: String(n.data.label ?? n.id), x: Math.round(n.position.x), y: Math.round(n.position.y) })),
    edges: edges.map((e) => ({ source: e.source, destination: e.target, weight: Number((e.data as any)?.weight ?? 1) })),
  };
}
export const withArrows = (edges: Edge[], directed: boolean): Edge[] =>
  edges.map((e) => ({ ...e, markerEnd: directed ? { type: MarkerType.ArrowClosed } : undefined }));
