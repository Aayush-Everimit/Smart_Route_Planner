import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentRoute { at: string; graphName: string; source: string; destination: string; algorithm: string; distance: number | null }
interface Toast { id: number; kind: 'success' | 'error'; text: string }
interface AppState {
  toasts: Toast[]; notify: (kind: Toast['kind'], text: string) => void; dismiss: (id: number) => void;
  recent: RecentRoute[]; addRecent: (r: RecentRoute) => void;
}
let n = 0;
export const useAppStore = create<AppState>()(persist((set, get) => ({
  toasts: [],
  notify: (kind, text) => { const id = ++n; set({ toasts: [...get().toasts, { id, kind, text }] }); setTimeout(() => get().dismiss(id), 4000); },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  recent: [],
  addRecent: (r) => set({ recent: [r, ...get().recent].slice(0, 8) }),
}), { name: 'srp-app', partialize: (s) => ({ recent: s.recent }) }));
