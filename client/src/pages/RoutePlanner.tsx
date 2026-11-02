import { useEffect, useState } from 'react';
import { Route as RouteIcon } from 'lucide-react';
import { errorMessage, graphsApi, routesApi } from '../api/client';
import { useGraphs } from '../components/useGraphs';
import { GraphView } from '../components/GraphView';
import { Empty, ErrorBox, Field, Spinner } from '../components/ui';
import { useAppStore } from '../stores/appStore';
import type { Algorithm, GraphDTO, ShortestPathResult } from '../types/api';

export default function RoutePlanner() {
  const { graphs, loading: listLoading, error: listError } = useGraphs();
  const { notify, addRecent } = useAppStore();
  const [graphId, setGraphId] = useState('');
  const [graph, setGraph] = useState<GraphDTO | null>(null);
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('dijkstra');
  const [result, setResult] = useState<ShortestPathResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(null); setGraph(null); setSource(''); setDest('');
    if (graphId) graphsApi.get(graphId).then(setGraph).catch((e) => setError(errorMessage(e)));
  }, [graphId]);

  const calc = async () => {
    if (!graph) return;
    setBusy(true); setError(null);
    try {
      const r = await routesApi.shortestPath({ graphId, source, destination: dest, algorithm });
      setResult(r); notify('success', r.reachable ? `Distance ${r.distance}` : 'Destination unreachable');
      addRecent({ at: new Date().toISOString(), graphName: graph.name, source, destination: dest, algorithm, distance: r.distance });
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Route Planner</h1>
      {listLoading && <Spinner />}
      {listError && <ErrorBox message={listError} />}
      {!listLoading && !graphs.length && !listError && <Empty title="No saved graphs — create one in the editor first." />}
      <div className="card flex flex-wrap items-end gap-3">
        <Field label="Graph"><select className="input" value={graphId} onChange={(e) => setGraphId(e.target.value)}><option value="">Select…</option>{graphs.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field label="Source"><select className="input" value={source} onChange={(e) => setSource(e.target.value)}><option value="">Select…</option>{graph?.nodes.map((n) => <option key={n.id} value={n.externalId}>{n.name}</option>)}</select></Field>
        <Field label="Destination"><select className="input" value={dest} onChange={(e) => setDest(e.target.value)}><option value="">Select…</option>{graph?.nodes.map((n) => <option key={n.id} value={n.externalId}>{n.name}</option>)}</select></Field>
        <Field label="Algorithm"><select className="input" value={algorithm} onChange={(e) => setAlgorithm(e.target.value as Algorithm)}><option value="dijkstra">Dijkstra</option><option value="floyd-warshall">Floyd-Warshall</option></select></Field>
        <button className="btn" disabled={!source || !dest || busy} onClick={calc}><RouteIcon className="h-4 w-4" />{busy ? 'Calculating…' : 'Calculate'}</button>
      </div>
      {error && <ErrorBox message={error} />}
      {result && (
        <div className="card" data-testid="route-result">
          {result.reachable
            ? <><div className="text-sm text-slate-500">Total distance</div><div className="text-3xl font-bold">{result.distance}</div>
                <ol className="mt-2 flex flex-wrap items-center gap-2 text-sm">{result.pathNodes!.map((n, i) => <li key={n.externalId} className="rounded bg-indigo-50 px-2 py-1">{i + 1}. {n.name}</li>)}</ol></>
            : <p className="font-medium text-amber-700">No route exists between these locations.</p>}
        </div>)}
      {graph && <GraphView graph={graph} path={result?.path} height={440} />}
    </div>
  );
}
