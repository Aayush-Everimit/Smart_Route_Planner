import axios, { AxiosError } from 'axios';
import type { AllPairsResult, Algorithm, CompareResult, GraphDTO, GraphPayload, GraphSummary, ShortestPathResult } from '../types/api';

export const http = axios.create({ baseURL: `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'}/api/v1`, timeout: 20000 });

export class ApiError extends Error {}
/** Normalises validation, API and network failures into one readable message. */
export function errorMessage(e: unknown): string {
  if (e instanceof AxiosError) {
    if (!e.response) return 'Cannot reach the API. Check your connection or VITE_API_BASE_URL.';
    const err = e.response.data?.error;
    if (err?.details?.length) return `${err.message}: ${err.details.map((d: any) => `${d.path} ${d.message}`).join('; ')}`;
    return err?.message ?? `Request failed (${e.response.status})`;
  }
  return e instanceof Error ? e.message : 'Unknown error';
}

const data = <T,>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

export const graphsApi = {
  list: () => data<GraphSummary[]>(http.get('/graphs')),
  get: (id: string) => data<GraphDTO>(http.get(`/graphs/${id}`)),
  create: (p: GraphPayload) => data<GraphDTO>(http.post('/graphs', p)),
  update: (id: string, p: GraphPayload) => data<GraphDTO>(http.put(`/graphs/${id}`, p)),
  remove: (id: string) => http.delete(`/graphs/${id}`).then(() => undefined),
};
export const routesApi = {
  shortestPath: (b: { graphId: string; source: string; destination: string; algorithm: Algorithm; includeSteps?: boolean }) => data<ShortestPathResult>(http.post('/routes/shortest-path', b)),
  allPairs: (graphId: string, includeSteps = false) => data<AllPairsResult>(http.post('/routes/all-pairs', { graphId, includeSteps })),
  compare: (b: { graphId: string; source: string; destination: string; trials: number }) => data<CompareResult>(http.post('/routes/compare', b)),
};
