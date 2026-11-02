import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { createInMemoryRepo } from './helpers/inMemoryRepo';

let repo: ReturnType<typeof createInMemoryRepo>;
let app: ReturnType<typeof createApp>;
const sample = {
  name: 'Test', directed: false,
  nodes: ['A', 'B', 'C', 'D'].map((id) => ({ externalId: id, name: `Node ${id}`, x: 0, y: 0 })),
  edges: [{ source: 'A', destination: 'B', weight: 1 }, { source: 'B', destination: 'C', weight: 2 }],
};
const missing = '11111111-1111-4111-8111-111111111111';
const make = async () => (await request(app).post('/api/v1/graphs').send(sample)).body.data.id as string;

beforeEach(() => { repo = createInMemoryRepo(); app = createApp({ repo, corsOrigins: ['http://localhost:5173'] }); });

describe('health & errors', () => {
  it('GET /health', async () => { const r = await request(app).get('/health'); expect(r.status).toBe(200); expect(r.body.data.status).toBe('ok'); });
  it('unknown route 404 with consistent shape', async () => { const r = await request(app).get('/nope'); expect(r.status).toBe(404); expect(r.body.success).toBe(false); });
  it('hides internals on db errors', async () => {
    repo.failNext(); const r = await request(app).get('/api/v1/graphs');
    expect(r.status).toBe(500); expect(r.body.error.message).toBe('Something went wrong'); expect(JSON.stringify(r.body)).not.toContain('db down');
  });
});

describe('graphs', () => {
  it('creates and fetches a graph', async () => {
    const c = await request(app).post('/api/v1/graphs').send(sample); expect(c.status).toBe(201);
    const g = await request(app).get(`/api/v1/graphs/${c.body.data.id}`); expect(g.status).toBe(200); expect(g.body.data.nodes).toHaveLength(4);
  });
  it('rejects invalid input', async () => { const r = await request(app).post('/api/v1/graphs').send({ name: '' }); expect(r.status).toBe(400); expect(r.body.error.code).toBe('VALIDATION_ERROR'); });
  it('rejects graph with edge to unknown node', async () => {
    const r = await request(app).post('/api/v1/graphs').send({ ...sample, edges: [{ source: 'A', destination: 'Z', weight: 1 }] }); expect(r.status).toBe(404);
  });
  it('404 for missing graph and 400 for bad uuid', async () => {
    expect((await request(app).get(`/api/v1/graphs/${missing}`)).status).toBe(404);
    expect((await request(app).get('/api/v1/graphs/not-a-uuid')).status).toBe(400);
  });
  it('lists, updates and deletes', async () => {
    const id = await make();
    expect((await request(app).get('/api/v1/graphs')).body.data).toHaveLength(1);
    expect((await request(app).put(`/api/v1/graphs/${id}`).send({ name: 'Renamed' })).body.data.name).toBe('Renamed');
    expect((await request(app).delete(`/api/v1/graphs/${id}`)).status).toBe(204);
    expect((await request(app).delete(`/api/v1/graphs/${id}`)).status).toBe(404);
  });
});

describe('nodes & edges', () => {
  it('adds a node, rejects duplicates, 404 on missing graph', async () => {
    const id = await make();
    const n = { externalId: 'Z', name: 'Zed', x: 1, y: 2 };
    expect((await request(app).post(`/api/v1/graphs/${id}/nodes`).send(n)).status).toBe(201);
    expect((await request(app).post(`/api/v1/graphs/${id}/nodes`).send(n)).status).toBe(409);
    expect((await request(app).post(`/api/v1/graphs/${missing}/nodes`).send(n)).status).toBe(404);
  });
  it('updates and deletes node; missing node 404', async () => {
    const id = await make();
    const nodes = (await request(app).get(`/api/v1/graphs/${id}/nodes`)).body.data;
    expect((await request(app).put(`/api/v1/graphs/${id}/nodes/${nodes[0].id}`).send({ name: 'New' })).body.data.name).toBe('New');
    expect((await request(app).delete(`/api/v1/graphs/${id}/nodes/${nodes[0].id}`)).status).toBe(204);
    expect((await request(app).delete(`/api/v1/graphs/${id}/nodes/${missing}`)).status).toBe(404);
  });
  it('adds and deletes edges; invalid endpoint 404', async () => {
    const id = await make();
    const e = await request(app).post(`/api/v1/graphs/${id}/edges`).send({ source: 'C', destination: 'D', weight: 3 }); expect(e.status).toBe(201);
    expect((await request(app).post(`/api/v1/graphs/${id}/edges`).send({ source: 'C', destination: 'Q', weight: 3 })).status).toBe(404);
    expect((await request(app).delete(`/api/v1/graphs/${id}/edges/${e.body.data.id}`)).status).toBe(204);
  });
});

describe('routes', () => {
  it.each(['dijkstra', 'floyd-warshall'])('shortest path via %s', async (algorithm) => {
    const id = await make();
    const r = await request(app).post('/api/v1/routes/shortest-path').send({ graphId: id, source: 'A', destination: 'C', algorithm });
    expect(r.status).toBe(200); expect(r.body.data.distance).toBe(3); expect(r.body.data.path).toEqual(['A', 'B', 'C']); expect(r.body.data.steps).toBeUndefined();
  });
  it('unreachable destination is a 200 with reachable=false', async () => {
    const id = await make();
    const r = await request(app).post('/api/v1/routes/shortest-path').send({ graphId: id, source: 'A', destination: 'D' });
    expect(r.status).toBe(200); expect(r.body.data.reachable).toBe(false); expect(r.body.data.path).toBeNull();
  });
  it('includes steps only when requested', async () => {
    const id = await make();
    const r = await request(app).post('/api/v1/routes/shortest-path').send({ graphId: id, source: 'A', destination: 'C', includeSteps: true });
    expect(r.body.data.steps.length).toBeGreaterThan(0);
  });
  it('missing node and missing graph → 404', async () => {
    const id = await make();
    expect((await request(app).post('/api/v1/routes/shortest-path').send({ graphId: id, source: 'A', destination: 'ZZ' })).status).toBe(404);
    expect((await request(app).post('/api/v1/routes/shortest-path').send({ graphId: missing, source: 'A', destination: 'B' })).status).toBe(404);
  });
  it('all-pairs and compare', async () => {
    const id = await make();
    const ap = await request(app).post('/api/v1/routes/all-pairs').send({ graphId: id }); expect(ap.body.data.distances[0][2]).toBe(3);
    const cmp = await request(app).post('/api/v1/routes/compare').send({ graphId: id, source: 'A', destination: 'C', trials: 3 });
    expect(cmp.status).toBe(200); expect(cmp.body.data.agree).toBe(true); expect(cmp.body.data.floydWarshall.timing.trials).toBe(3);
  });
  it('compare reports Dijkstra unsupported for negative weights', async () => {
    const g = (await request(app).post('/api/v1/graphs').send({ ...sample, directed: true, edges: [{ source: 'A', destination: 'B', weight: -1 }] })).body.data.id;
    const r = await request(app).post('/api/v1/routes/compare').send({ graphId: g, source: 'A', destination: 'B', trials: 1 });
    expect(r.body.data.dijkstra.supported).toBe(false);
  });
});
