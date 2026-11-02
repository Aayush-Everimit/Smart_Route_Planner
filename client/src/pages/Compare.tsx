import { useEffect, useState } from 'react';
import { errorMessage, graphsApi, routesApi } from '../api/client';
import { useGraphs } from '../components/useGraphs';
import { ErrorBox, Field, Spinner } from '../components/ui';
import type { CompareResult, GraphDTO } from '../types/api';

const fmt = (n: number) => (n < 0.01 ? n.toFixed(4) : n.toFixed(3));

export default function Compare() {
  const { graphs } = useGraphs();
  const [graphId, setGraphId] = useState('');
  const [graph, setGraph] = useState<GraphDTO | null>(null);
  const [source, setSource] = useState(''); const [dest, setDest] = useState('');
  const [trials, setTrials] = useState(25);
  const [res, setRes] = useState<CompareResult | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);

  useEffect(() => { setGraph(null); setRes(null); if (graphId) graphsApi.get(graphId).then(setGraph).catch((e) => setError(errorMessage(e))); }, [graphId]);
  const run = async () => { setBusy(true); setError(null); try { setRes(await routesApi.compare({ graphId, source, destination: dest, trials })); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); } };

  const bars = res ? [
    ...(res.dijkstra.supported ? [{ label: 'Dijkstra (single source)', ms: res.dijkstra.singleSource.medianMs, c: 'bg-indigo-500' }, { label: 'Dijkstra (all pairs, V runs)', ms: res.dijkstra.allPairs.medianMs, c: 'bg-sky-500' }] : []),
    { label: 'Floyd-Warshall (all pairs)', ms: res.floydWarshall.timing.medianMs, c: 'bg-emerald-500' },
  ] : [];
  const max = Math.max(...bars.map((b) => b.ms), 1e-9);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Algorithm Comparison</h1>
      <div className="card flex flex-wrap items-end gap-3">
        <Field label="Graph"><select className="input" value={graphId} onChange={(e) => setGraphId(e.target.value)}><option value="">Select…</option>{graphs.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field label="Source"><select className="input" value={source} onChange={(e) => setSource(e.target.value)}><option value="">Select…</option>{graph?.nodes.map((n) => <option key={n.id} value={n.externalId}>{n.name}</option>)}</select></Field>
        <Field label="Destination"><select className="input" value={dest} onChange={(e) => setDest(e.target.value)}><option value="">Select…</option>{graph?.nodes.map((n) => <option key={n.id} value={n.externalId}>{n.name}</option>)}</select></Field>
        <Field label="Trials"><input className="input w-20" type="number" min={1} max={200} value={trials} onChange={(e) => setTrials(Math.min(200, Math.max(1, e.target.valueAsNumber || 1)))} /></Field>
        <button className="btn" disabled={!source || !dest || busy} onClick={run}>{busy ? 'Benchmarking…' : 'Compare'}</button>
      </div>
      {error && <ErrorBox message={error} />}
      {busy && <Spinner label="Running trials…" />}
      {res && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            {[['Vertices', res.vertices], ['Edges', res.edges], ['Trials', res.floydWarshall.timing.trials], ['Results agree', res.agree === null ? 'n/a' : res.agree ? 'Yes' : 'No']].map(([l, v]) => (
              <div key={String(l)} className="card"><div className="text-sm text-slate-500">{l}</div><div className="text-2xl font-bold">{String(v)}</div></div>))}
          </div>
          {!res.dijkstra.supported && <ErrorBox message={`Dijkstra skipped: ${res.dijkstra.reason}`} />}
          <div className="card space-y-3" data-testid="bars">
            <h2 className="font-semibold">Median execution time (ms)</h2>
            {bars.map((b) => (
              <div key={b.label}><div className="flex justify-between text-sm"><span>{b.label}</span><span>{fmt(b.ms)} ms</span></div>
                <div className="h-3 rounded bg-slate-100"><div className={`h-3 rounded ${b.c}`} style={{ width: `${Math.max(2, (b.ms / max) * 100)}%` }} /></div></div>))}
          </div>
          <div className="card overflow-x-auto text-sm">
            <table className="w-full text-left"><thead><tr><th className="p-2">Algorithm</th><th className="p-2">Time</th><th className="p-2">Space</th><th className="p-2">Negative edges</th></tr></thead>
              <tbody>
                <tr><td className="p-2">Dijkstra</td><td className="p-2">O((V+E) log V) per source</td><td className="p-2">O(V)</td><td className="p-2">No</td></tr>
                <tr><td className="p-2">Floyd-Warshall</td><td className="p-2">O(V³)</td><td className="p-2">O(V²)</td><td className="p-2">Yes (detects negative cycles)</td></tr>
              </tbody></table>
          </div>
          <div className="card space-y-2 text-sm">
            <h2 className="font-semibold">Tradeoffs</h2>
            <p>Use Dijkstra for one source (or few sources) on sparse, non-negative graphs: it scales with edges. Floyd-Warshall computes every pair in one simple pass, is robust to negative weights, and wins on small dense graphs or when you need the full matrix, but cubic time becomes costly as V grows.</p>
            <p className="text-xs text-slate-500"><b>Methodology:</b> {res.methodology}</p>
          </div>
        </>)}
    </div>
  );
}
