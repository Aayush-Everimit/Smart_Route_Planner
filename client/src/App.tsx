import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import GraphEditor from './pages/GraphEditor';
import RoutePlanner from './pages/RoutePlanner';
import Visualizer from './pages/Visualizer';
import Compare from './pages/Compare';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="editor" element={<GraphEditor />} />
          <Route path="editor/:graphId" element={<GraphEditor />} />
          <Route path="route" element={<RoutePlanner />} />
          <Route path="visualizer" element={<Visualizer />} />
          <Route path="compare" element={<Compare />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
