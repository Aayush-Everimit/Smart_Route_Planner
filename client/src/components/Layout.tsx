import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, GitBranch, LayoutDashboard, Map, Network } from 'lucide-react';
import { Toasts } from './ui';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/editor', label: 'Graph Editor', icon: Network },
  { to: '/route', label: 'Route Planner', icon: Map },
  { to: '/visualizer', label: 'Visualizer', icon: GitBranch },
  { to: '/compare', label: 'Compare', icon: BarChart3 },
];

export function Layout() {
  return (
    <div className="min-h-screen md:flex">
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white p-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:p-4">
        <div className="hidden px-2 pb-4 text-lg font-bold text-indigo-700 md:block">Smart Route Planner</div>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm ${isActive ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Icon className="h-4 w-4" />{label}
          </NavLink>
        ))}
      </nav>
      <main className="min-w-0 flex-1 p-4 md:p-6"><Outlet /></main>
      <Toasts />
    </div>
  );
}
