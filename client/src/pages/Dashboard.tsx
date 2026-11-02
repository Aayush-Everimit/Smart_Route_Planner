import { Link } from 'react-router-dom';
import { GitBranch, Map, Network, Plus } from 'lucide-react';
import { useGraphs } from '../components/useGraphs';
import { Empty, ErrorBox, Spinner } from '../components/ui';
import { useAppStore } from '../stores/appStore';

export default function Dashboard() {
  const { graphs, loading, error } = useGraphs();
  const recent = useAppStore((s) => s.recent);
  const totalNodes = graphs.reduce((a, g) => a + g.nodeCount, 0);
  const totalEdges = graphs.reduce((a, g) => a + g.edgeCount, 0);
  const cards = [['Saved graphs', graphs.length], ['Total nodes', totalNodes], ['Total edges', totalEdges]] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(([label, v]) => (
          <div key={label} className="card"><div className="text-sm text-slate-500">{label}</div><div className="text-3xl font-bold" data-testid={`stat-${label}`}>{v}</div></div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link className="btn" to="/editor"><Plus className="h-4 w-4" />New graph</Link>
        <Link className="btn-ghost" to="/route"><Map className="h-4 w-4" />Plan a route</Link>
        <Link className="btn-ghost" to="/visualizer"><GitBranch className="h-4 w-4" />Visualize algorithm</Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section><h2 className="mb-2 font-semibold">Recently modified graphs</h2>
          {!loading && !graphs.length ? <Empty title="No graphs yet">Create your first graph in the editor.</Empty> : (
            <ul className="card divide-y divide-slate-100 p-0">
              {graphs.slice(0, 6).map((g) => (
                <li key={g.id}><Link to={`/editor/${g.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                  <span className="flex items-center gap-2"><Network className="h-4 w-4 text-indigo-600" />{g.name}</span>
                  <span className="text-xs text-slate-500">{g.nodeCount} nodes · {g.edgeCount} edges · {new Date(g.updatedAt).toLocaleDateString()}</span>
                </Link></li>
              ))}
            </ul>)}
        </section>
        <section><h2 className="mb-2 font-semibold">Recent route calculations</h2>
          {!recent.length ? <Empty title="No calculations yet" /> : (
            <ul className="card divide-y divide-slate-100 p-0">
              {recent.map((r, i) => (
                <li key={i} className="flex justify-between px-4 py-3 text-sm"><span>{r.graphName}: {r.source} → {r.destination}</span>
                  <span className="text-slate-500">{r.distance ?? 'unreachable'} · {r.algorithm}</span></li>
              ))}
            </ul>)}
        </section>
      </div>
    </div>
  );
}
