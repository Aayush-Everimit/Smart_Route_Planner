export type GraphErrorCode =
  | 'DUPLICATE_NODE' | 'NODE_NOT_FOUND' | 'INVALID_WEIGHT' | 'NEGATIVE_WEIGHT' | 'NEGATIVE_CYCLE' | 'INVALID_INPUT';

export class GraphError extends Error {
  constructor(public readonly code: GraphErrorCode, message: string) {
    super(message);
    this.name = 'GraphError';
  }
}
