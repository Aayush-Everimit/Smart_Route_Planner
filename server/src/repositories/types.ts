export interface NodeDTO { id: string; externalId: string; name: string; x: number; y: number }
export interface EdgeDTO { id: string; source: string; destination: string; weight: number } // source/destination = external node ids
export interface GraphSummary { id: string; name: string; directed: boolean; createdAt: string; updatedAt: string; nodeCount: number; edgeCount: number }
export interface GraphDTO { id: string; name: string; directed: boolean; createdAt: string; updatedAt: string; nodes: NodeDTO[]; edges: EdgeDTO[] }

export interface NodeInput { externalId: string; name: string; x: number; y: number }
export interface EdgeInput { source: string; destination: string; weight: number }

export interface GraphRepository {
  createGraph(i: { name: string; directed: boolean; nodes: NodeInput[]; edges: EdgeInput[] }): Promise<GraphDTO>;
  listGraphs(): Promise<GraphSummary[]>;
  getGraph(id: string): Promise<GraphDTO | null>;
  /** If nodes/edges are provided the graph contents are fully replaced. */
  updateGraph(id: string, i: { name?: string; directed?: boolean; nodes?: NodeInput[]; edges?: EdgeInput[] }): Promise<GraphDTO | null>;
  deleteGraph(id: string): Promise<boolean>;
  createNode(graphId: string, i: NodeInput): Promise<NodeDTO>;
  listNodes(graphId: string): Promise<NodeDTO[]>;
  updateNode(graphId: string, nodeId: string, i: Partial<Omit<NodeInput, 'externalId'>>): Promise<NodeDTO | null>;
  deleteNode(graphId: string, nodeId: string): Promise<boolean>;
  createEdge(graphId: string, i: EdgeInput): Promise<EdgeDTO>;
  listEdges(graphId: string): Promise<EdgeDTO[]>;
  deleteEdge(graphId: string, edgeId: string): Promise<boolean>;
  graphExists(id: string): Promise<boolean>;
}
