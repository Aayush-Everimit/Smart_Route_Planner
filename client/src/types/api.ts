// API contract types — deliberately separate from React Flow's types.
export interface NodeDTO { id: string; externalId: string; name: string; x: number; y: number }
export interface EdgeDTO { id: string; source: string; destination: string; weight: number }
export interface GraphSummary { id: string; name: string; directed: boolean; createdAt: string; updatedAt: string; nodeCount: number; edgeCount: number }
export interface GraphDTO { id: string; name: string; directed: boolean; createdAt: string; updatedAt: string; nodes: NodeDTO[]; edges: EdgeDTO[] }
export interface GraphPayload {
  name: string; directed: boolean;
  nodes: { externalId: string; name: string; x: number; y: number }[];
  edges: { source: string; destination: string; weight: number }[];
}
export type Algorithm = 'dijkstra' | 'floyd-warshall';
export interface DijkstraStep {
  current: string; distances: Record<string, number | null>; queue: { node: string; distance: number }[];
  relaxed: { from: string; to: string; weight: number; improved: boolean }[]; visited: string[];
}
export interface FWStep { k: number; kNode: string; matrix: (number | null)[][]; updated: [number, number][] }
export interface ShortestPathResult {
  graphId: string; algorithm: Algorithm; source: string; destination: string; reachable: boolean;
  distance: number | null; path: string[] | null; pathNodes: { externalId: string; name: string }[] | null;
  steps?: DijkstraStep[] | FWStep[];
}
export interface AllPairsResult {
  graphId: string; nodes: string[]; distances: (number | null)[][]; next: (number | null)[][]; negativeCycle: boolean; steps?: FWStep[];
}
export interface Timing { medianMs: number; minMs: number; maxMs: number; trials: number }
export interface CompareResult {
  vertices: number; edges: number; agree: boolean | null; methodology: string;
  dijkstra: { supported: false; reason: string } | { supported: true; distance: number | null; path: string[] | null; singleSource: Timing; allPairs: Timing; complexity: { time: string; space: string } };
  floydWarshall: { negativeCycle: boolean; distance: number | null; timing: Timing; complexity: { time: string; space: string } };
}
