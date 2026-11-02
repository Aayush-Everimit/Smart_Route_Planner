import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, type Connection } from '@xyflow/react';
import { Download, Plus, Save, Trash2, Upload } from 'lucide-react';
import { errorMessage, graphsApi } from '../api/client';
import { useEditorStore } from '../stores/editorStore';
import { useAppStore } from '../stores/appStore';
import { ErrorBox, Field, Spinner } from '../components/ui';
import { useGraphs } from '../components/useGraphs';
import { withArrows } from '../lib/graphMapping';
import type { GraphPayload } from '../types/api';

function Editor() {
  const { graphId } = useParams();
  const nav = useNavigate();
  const s = useEditorStore();
  const notify = useAppStore((a) => a.notify);
  const { graphs, reload } = useGraphs();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!graphId) { s.reset(); return; }
    setLoading(true); setError(null);
    graphsApi.get(graphId).then(s.load).catch((e) => setError(errorMessage(e))).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphId]);

  const selNode = s.nodes.find((n) => n.selected);
  const selEdge = s.edges.find((e) => e.selected);
  const edges = useMemo(() => withArrows(s.edges, s.directed), [s.edges, s.directed]);

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const g = s.graphId ? await graphsApi.update(s.graphId, s.payload()) : await graphsApi.create(s.payload());
      s.load(g); notify('success', 'Graph saved'); reload();
      if (!s.graphId) nav(`/editor/${g.id}`, { replace: true });
    } catch (e) { setError(errorMessage(e)); notify('error', 'Save failed'); } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!s.graphId || !confirm('Delete this graph permanently?')) return;
    try { await graphsApi.remove(s.graphId); notify('success', 'Graph deleted'); reload(); nav('/editor'); } catch (e) { setError(errorMessage(e)); }
  };
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(s.payload(), null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `${s.name || 'graph'}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importJson = async (f: File) => {
    try {
      const p = JSON.parse(await f.text()) as GraphPayload;
      if (!Array.isArray(p.nodes) || !Array.isArray(p.edges)) throw new Error('File must contain "nodes" and "edges" arrays');
      s.importPayload({ name: p.name ?? 'Imported graph', directed: !!p.directed, nodes: p.nodes, edges: p.edges }); notify('success', 'Imported — remember to save');
    } catch (e) { setError(`Import failed: ${errorMessage(e)}`); }
  };
  const onConnect = (c: Connection) => { if (c.source && c.target) s.connect(c.source, c.target, 1); };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="text-2xl font-bold">Graph Editor</h1>
        <Field label="Open graph">
          <select className="input" value={graphId ?? ''} onChange={(e) => nav(e.target.value ? `/editor/${e.target.value}` : '/editor')}>
            <option value="">New graph</option>{graphs.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>
        <Field label="Name"><input className="input" value={s.name} onChange={(e) => s.setName(e.target.value)} /></Field>
        <label className="flex items-center gap-2 pb-1.5 text-sm"><input type="checkbox" checked={s.directed} onChange={(e) => s.setDirected(e.target.checked)} />Directed</label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={() => s.addNode('')}><Plus className="h-4 w-4" />Add node</button>
        <button className="btn-ghost" onClick={s.removeSelected} disabled={!selNode && !selEdge}><Trash2 className="h-4 w-4" />Delete selected</button>
        <button className="btn" onClick={save} disabled={saving || !s.nodes.length}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save'}</button>
        <button className="btn-ghost" onClick={exportJson}><Download className="h-4 w-4" />Export</button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" />Import</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        {s.graphId && <button className="btn-ghost text-red-600" onClick={remove}>Delete graph</button>}
        {s.dirty && <span className="self-center text-xs text-amber-600">Unsaved changes</span>}
      </div>
      {error && <ErrorBox message={error} />}
      {loading ? <Spinner /> : (
        <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
          <div className="card h-[520px] overflow-hidden p-0" data-testid="editor-canvas">
            <ReactFlow nodes={s.nodes} edges={edges} onNodesChange={s.onNodesChange} onEdgesChange={s.onEdgesChange} onConnect={onConnect} fitView deleteKeyCode={['Backspace', 'Delete']} proOptions={{ hideAttribution: true }}>
              <Background /><Controls /><MiniMap pannable zoomable />
            </ReactFlow>
          </div>
          <aside className="card space-y-3 text-sm" aria-label="Properties">
            <h2 className="font-semibold">Properties</h2>
            {selNode && <Field label="Node label"><input className="input" value={String(selNode.data.label)} onChange={(e) => s.renameNode(selNode.id, e.target.value)} /></Field>}
            {selEdge && <Field label="Edge weight"><input className="input" type="number" value={String((selEdge.data as any)?.weight ?? 1)} onChange={(e) => Number.isFinite(e.target.valueAsNumber) && s.setWeight(selEdge.id, e.target.valueAsNumber)} /></Field>}
            {!selNode && !selEdge && <p className="text-slate-500">Select a node or edge. Drag from a node handle to another node to connect them.</p>}
            <p className="text-xs text-slate-400">{s.nodes.length} nodes · {s.edges.length} edges</p>
          </aside>
        </div>)}
    </div>
  );
}

export default function GraphEditor() { return <ReactFlowProvider><Editor /></ReactFlowProvider>; }
