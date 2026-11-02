import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';

interface Props { index: number; total: number; onChange: (i: number) => void; intervalMs?: number }

export function StepControls({ index, total, onChange, intervalMs = 900 }: Props) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (index >= total - 1) { setPlaying(false); return; }
    const t = setTimeout(() => onChange(index + 1), intervalMs);
    return () => clearTimeout(t);
  }, [playing, index, total, intervalMs, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Step controls">
      <button className="btn-ghost" aria-label="Previous step" disabled={index <= 0} onClick={() => onChange(index - 1)}><SkipBack className="h-4 w-4" /></button>
      {playing
        ? <button className="btn" aria-label="Pause" onClick={() => setPlaying(false)}><Pause className="h-4 w-4" />Pause</button>
        : <button className="btn" aria-label="Play" disabled={index >= total - 1} onClick={() => setPlaying(true)}><Play className="h-4 w-4" />Play</button>}
      <button className="btn-ghost" aria-label="Next step" disabled={index >= total - 1} onClick={() => onChange(index + 1)}><SkipForward className="h-4 w-4" /></button>
      <button className="btn-ghost" aria-label="Reset" onClick={() => { setPlaying(false); onChange(0); }}><RotateCcw className="h-4 w-4" />Reset</button>
      <span className="text-sm text-slate-500" data-testid="step-label">Step {total ? index + 1 : 0} / {total}</span>
    </div>
  );
}
