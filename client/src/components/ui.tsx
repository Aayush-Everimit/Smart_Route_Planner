import { Loader2, AlertTriangle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAppStore } from '../stores/appStore';

export const Spinner = ({ label = 'Loading…' }: { label?: string }) => (
  <div role="status" className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{label}</div>
);
export const ErrorBox = ({ message }: { message: string }) => (
  <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>
);
export const Empty = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="card flex flex-col items-center gap-2 py-10 text-center text-slate-500"><Inbox className="h-8 w-8" /><p className="font-medium text-slate-700">{title}</p>{children}</div>
);
export const Toasts = () => {
  const { toasts, dismiss } = useAppStore();
  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <button key={t.id} onClick={() => dismiss(t.id)} className={`rounded-md px-4 py-2 text-left text-sm text-white shadow-lg ${t.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>{t.text}</button>
      ))}
    </div>
  );
};
export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">{label}{children}</label>
);
