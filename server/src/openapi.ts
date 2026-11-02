const id = { type: 'string', format: 'uuid' };
const p = (name: string) => ({ name, in: 'path', required: true, schema: id });
const body = (ref: string) => ({ required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } } });
const res = (d: string) => ({ description: d });
const common = { '400': res('Validation error'), '404': res('Not found'), '500': res('Internal error') };

export const openapi = {
  openapi: '3.0.3',
  info: { title: 'Smart Route Planner API', version: '1.0.0', description: 'Weighted-graph routing (Dijkstra, Floyd-Warshall). All responses: { success, data } or { success:false, error:{code,message,details?} }.' },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/graphs': {
      get: { summary: 'List graphs', responses: { '200': res('OK') } },
      post: { summary: 'Create graph (optionally with nodes and edges)', requestBody: body('CreateGraph'), responses: { '201': res('Created'), '400': res('Validation error'), '409': res('Conflict') } },
    },
    '/graphs/{graphId}': {
      get: { summary: 'Get graph with nodes and edges', parameters: [p('graphId')], responses: { '200': res('OK'), ...common } },
      put: { summary: 'Update graph; supplying nodes replaces contents', parameters: [p('graphId')], requestBody: body('UpdateGraph'), responses: { '200': res('OK'), ...common } },
      delete: { summary: 'Delete graph (cascades)', parameters: [p('graphId')], responses: { '204': res('Deleted'), ...common } },
    },
    '/graphs/{graphId}/nodes': {
      get: { summary: 'List nodes', parameters: [p('graphId')], responses: { '200': res('OK'), ...common } },
      post: { summary: 'Add node', parameters: [p('graphId')], requestBody: body('Node'), responses: { '201': res('Created'), '409': res('Duplicate externalId'), ...common } },
    },
    '/graphs/{graphId}/nodes/{nodeId}': {
      put: { summary: 'Update node name/position', parameters: [p('graphId'), p('nodeId')], responses: { '200': res('OK'), ...common } },
      delete: { summary: 'Delete node (and its edges)', parameters: [p('graphId'), p('nodeId')], responses: { '204': res('Deleted'), ...common } },
    },
    '/graphs/{graphId}/edges': {
      get: { summary: 'List edges', parameters: [p('graphId')], responses: { '200': res('OK'), ...common } },
      post: { summary: 'Add edge (external node ids)', parameters: [p('graphId')], requestBody: body('Edge'), responses: { '201': res('Created'), '409': res('Duplicate edge'), ...common } },
    },
    '/graphs/{graphId}/edges/{edgeId}': {
      delete: { summary: 'Delete edge', parameters: [p('graphId'), p('edgeId')], responses: { '204': res('Deleted'), ...common } },
    },
    '/routes/shortest-path': { post: { summary: 'Shortest path on a persisted graph', requestBody: body('ShortestPath'), responses: { '200': res('OK'), '422': res('Negative cycle'), ...common } } },
    '/routes/all-pairs': { post: { summary: 'All-pairs shortest paths (Floyd-Warshall)', requestBody: body('AllPairs'), responses: { '200': res('OK'), ...common } } },
    '/routes/compare': { post: { summary: 'Benchmark Dijkstra vs Floyd-Warshall (median of N trials)', requestBody: body('Compare'), responses: { '200': res('OK'), ...common } } },
  },
  components: {
    schemas: {
      Node: { type: 'object', required: ['externalId', 'name'], properties: { externalId: { type: 'string' }, name: { type: 'string' }, x: { type: 'number' }, y: { type: 'number' } } },
      Edge: { type: 'object', required: ['source', 'destination', 'weight'], properties: { source: { type: 'string' }, destination: { type: 'string' }, weight: { type: 'number' } } },
      CreateGraph: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, directed: { type: 'boolean' }, nodes: { type: 'array', items: { $ref: '#/components/schemas/Node' } }, edges: { type: 'array', items: { $ref: '#/components/schemas/Edge' } } } },
      UpdateGraph: { type: 'object', properties: { name: { type: 'string' }, directed: { type: 'boolean' }, nodes: { type: 'array', items: { $ref: '#/components/schemas/Node' } }, edges: { type: 'array', items: { $ref: '#/components/schemas/Edge' } } } },
      ShortestPath: { type: 'object', required: ['graphId', 'source', 'destination'], properties: { graphId: id, source: { type: 'string' }, destination: { type: 'string' }, algorithm: { type: 'string', enum: ['dijkstra', 'floyd-warshall'] }, includeSteps: { type: 'boolean' } } },
      AllPairs: { type: 'object', required: ['graphId'], properties: { graphId: id, includeSteps: { type: 'boolean' } } },
      Compare: { type: 'object', required: ['graphId', 'source', 'destination'], properties: { graphId: id, source: { type: 'string' }, destination: { type: 'string' }, trials: { type: 'integer', minimum: 1, maximum: 200 } } },
    },
  },
} as const;

export const docsHtml = `<!doctype html><html><head><title>Smart Route Planner API</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"></head>
<body><div id="ui"></div><script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({ url: '/api/openapi.json', dom_id: '#ui' })</script></body></html>`;
