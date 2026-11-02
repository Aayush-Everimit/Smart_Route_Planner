import { create } from 'zustand';
import { applyEdgeChanges, applyNodeChanges, type Edge, type EdgeChange, type Node, type NodeChange } from '@xyflow/react';
import type { GraphDTO, GraphPayload } from '../types/api';
import { toFlow, toPayload } from '../lib/graphMapping';

interface EditorState {
  graphId: string | null; name: string; directed: boolean; nodes: Node[]; edges: Edge[]; dirty: boolean;
  load: (g: GraphDTO) => void; reset: () => void;
  setName: (n: string) => void; setDirected: (d: boolean) => void;
  onNodesChange: (c: NodeChange[]) => void; onEdgesChange: (c: EdgeChange[]) => void;
  addNode: (label: string) => void; renameNode: (id: string, label: string) => void;
  connect: (source: string, target: string, weight: number) => void; setWeight: (id: string, w: number) => void;
  removeSelected: () => void; payload: () => GraphPayload; importPayload: (p: GraphPayload) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  graphId: null, name: 'Untitled graph', directed: false, nodes: [], edges: [], dirty: false,
  load: (g) => set({ graphId: g.id, name: g.name, directed: g.directed, ...toFlow(g), dirty: false }),
  reset: () => set({ graphId: null, name: 'Untitled graph', directed: false, nodes: [], edges: [], dirty: false }),
  setName: (name) => set({ name, dirty: true }),
  setDirected: (directed) => set({ directed, dirty: true }),
  onNodesChange: (c) => set({ nodes: applyNodeChanges(c, get().nodes), dirty: true }),
  onEdgesChange: (c) => set({ edges: applyEdgeChanges(c, get().edges), dirty: true }),
  addNode: (label) => {
    const nodes = get().nodes;
    let i = nodes.length + 1; while (nodes.some((n) => n.id === `N${i}`)) i++;
    const id = `N${i}`;
    set({ nodes: [...nodes, { id, position: { x: 80 + (nodes.length % 5) * 140, y: 80 + Math.floor(nodes.length / 5) * 120 }, data: { label: label || id } }], dirty: true });
  },
  renameNode: (id, label) => set({ nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)), dirty: true }),
  connect: (source, target, weight) => {
    if (source === target) return;
    const exists = get().edges.some((e) => (e.source === source && e.target === target) || (!get().directed && e.source === target && e.target === source));
    if (exists) return;
    set({ edges: [...get().edges, { id: `e-${source}-${target}-${Date.now()}`, source, target, label: String(weight), data: { weight } }], dirty: true });
  },
  setWeight: (id, w) => set({ edges: get().edges.map((e) => (e.id === id ? { ...e, label: String(w), data: { weight: w } } : e)), dirty: true }),
  removeSelected: () => {
    const { nodes, edges } = get();
    const gone = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
    set({ nodes: nodes.filter((n) => !n.selected), edges: edges.filter((e) => !e.selected && !gone.has(e.source) && !gone.has(e.target)), dirty: true });
  },
  payload: () => toPayload(get().name, get().directed, get().nodes, get().edges),
  importPayload: (p) => set({ name: p.name, directed: p.directed, ...toFlow({ nodes: p.nodes.map((n) => ({ ...n, id: n.externalId })), edges: p.edges.map((e, i) => ({ ...e, id: String(i) })) }), dirty: true }),
}));
