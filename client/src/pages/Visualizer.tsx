import { useEffect, useMemo, useState } from 'react';
import { errorMessage, graphsApi, routesApi } from '../api/client';
import { useGraphs } from '../components/useGraphs';
import { GraphView } from '../components/GraphView';
import { StepControls } from '../components/StepControls';
import { ErrorBox, Field, Spinner } from '../components/ui';
import { walkPath } from '../lib/path';
import type { AllPairsResult, DijkstraStep, GraphDTO } from '../types/api';

export default function Visualizer() {
  const { graphs } = useGraphs();
  const [graphId, setGraphId] = useState('');
  const [graph, setGraph] = useState<GraphDTO | null>(null);
  const [algo, setAlgo] = useState<'dijkstra' | 'floyd-warshall'>('dijkstra');
  const [source, setSource] = useState('');
  const [dj, setDj] = useState<DijkstraStep[] | null>(null);
  const [fw, setFw] = useState<AllPairsResult | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pa, setPa] = useState(''); const [pb, setPb] = useState('');

  useEffect(() => { setGraph(null); setDj(null); setFw(null); setSource(''); if (graphId) graphsApi.get(graphId).then(setGraph).catch((e) => setError(errorMessage(e))); }, [graphId]);

  const run = async () => {
    if (!graph) return;
    setBusy(true); setError(null); setStep(0); setDj(null); setFw(null);
    try {
      if (algo === 'dijkstra') {
        const r = await routesApi.shortestPath({ graphId, source, destination: source, algorithm: 'dijkstra', includeSteps: true });
        setDj((r.steps as DijkstraStep[]) ?? []);
      } else setFw(await routesApi.allPairs(graphId, true));
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };

  const d = dj?.[step];
  const f = fw?.steps?.[step];
  const fwPath = useMemo(() => (fw && pa && pb && !fw.negativeCycle ? walkPath(fw.nodes, fw.next, fw.distances, pa, pb) : null), [fw, pa, pb]);
  const total = algo === 'dijkstra' ? dj?.length ?? 0 : fw?.steps?.length ?? 0;
  const name = (id: string) => graph?.nodes.find((n) => n.externalId === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Algorithm Visualizer</h1>
      <div className="card flex flex-wrap items-end gap-3">
        <Field label="Graph"><select className="input" value={graphId} onChange={(e) => setGraphId(e.target.value)}><option value="">Select…</option>{graphs.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        <Field label="Algorithm"><select className="input" value={algo} onChange={(e) => { setAlgo(e.target.value as typeof algo); setDj(null); setFw(null); }}><option value="dijkstra">Dijkstra</option><option value="floyd-warshall">Floyd-Warshall</option></select></Field>
        {algo === 'dijkstra' && <Field label="Source"><select className="input" value={source} onChange={(e) => setSource(e.target.value)}><option value="">Select…</option>{graph?.nodes.map((n) => <option key={n.id} value={n.externalId}>{n.name}</option>)}</select></Field>}
        <button className="btn" onClick={run} disabled={!graph || busy || (algo === 'dijkstra' && !source)}>{busy ? 'Running…' : 'Run'}</button>
      </div>
      {error && <ErrorBox message={error} />}
      {busy && <Spinner label="Computing steps…" />}
      {total > 0 && <div className="card"><StepControls index={step} total={total} onChange={setStep} /></div>}

      {graph && algo === 'dijkstra' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <GraphView graph={graph} current={d?.current} visited={d?.visited} relaxed={d?.relaxed} distances={d?.distances} height={440} />
          <div className="card space-y-3 text-sm">
            {d ? <>
              <div><b>Current:</b> {name(d.current)}</div>
              <div><b>Visited:</b> {d.visited.map(name).join(', ')}</div>
              <div><b>Priority queue:</b> {d.queue.length ? d.queue.map((q) => `${name(q.node)}(${q.distance})`).join(', ') : 'empty'}</div>
              <div><b>Relaxed edges:</b><ul>{d.relaxed.length ? d.relaxed.map((r, i) => <li key={i} className={r.improved ? 'text-emerald-700' : 'text-amber-700'}>{name(r.from)}→{name(r.to)} ({r.weight}) {r.improved ? 'improved' : 'no change'}</li>) : <li>none</li>}</ul></div>
            </> : <p className="text-slate-500">Pick a source and press Run.</p>}
          </div>
        </div>)}

      {algo === 'floyd-warshall' && fw && (
        <div className="space-y-3">
          {fw.negativeCycle && <ErrorBox message="Negative cycle detected: some distances are undefined (diagonal contains negative values)." />}
          {f && (
            <div className="card overflow-x-auto">
              <p className="mb-2 text-sm">Intermediate vertex k = <b>{name(f.kNode)}</b> · {f.updated.length} cell(s) updated</p>
              <table className="border-collapse text-center text-sm" data-testid="fw-matrix">
                <thead><tr><th className="p-1" />{fw.nodes.map((n, j) => <th key={n} className={`p-1 ${j === f.k ? 'bg-amber-100' : ''}`}>{name(n)}</th>)}</tr></thead>
                <tbody>{f.matrix.map((row, i) => (
                  <tr key={i}><th className={`p-1 ${i === f.k ? 'bg-amber-100' : ''}`}>{name(fw.nodes[i])}</th>
                    {row.map((v, j) => {
                      const upd = f.updated.some(([a, b]) => a === i && b === j);
                      return <td key={j} className={`border border-slate-200 px-3 py-1 ${upd ? 'bg-emerald-200 font-bold' : i === f.k || j === f.k ? 'bg-amber-50' : ''}`}>{v === null ? '∞' : v}</td>;
                    })}</tr>))}</tbody>
              </table>
            </div>)}
          <div className="card flex flex-wrap items-end gap-3 text-sm">
            <Field label="Path from"><select className="input" value={pa} onChange={(e) => setPa(e.target.value)}><option value="">Select…</option>{fw.nodes.map((n) => <option key={n} value={n}>{name(n)}</option>)}</select></Field>
            <Field label="to"><select className="input" value={pb} onChange={(e) => setPb(e.target.value)}><option value="">Select…</option>{fw.nodes.map((n) => <option key={n} value={n}>{name(n)}</option>)}</select></Field>
            {pa && pb && <span data-testid="fw-path">{fwPath ? fwPath.map(name).join(' → ') : 'No path'}</span>}
          </div>
          {graph && <GraphView graph={graph} path={fwPath} height={360} />}
        </div>)}
    </div>
  );
}
