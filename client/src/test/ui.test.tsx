import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { StepControls } from '../components/StepControls';
import { ErrorBox, Empty } from '../components/ui';
import { toPayload, toFlow } from '../lib/graphMapping';
import { walkPath } from '../lib/path';
import { useEditorStore } from '../stores/editorStore';
import { errorMessage } from '../api/client';
import { AxiosError } from 'axios';

vi.mock('../components/useGraphs', () => ({ useGraphs: () => ({ graphs: [], loading: false, error: null, reload: vi.fn() }) }));
import Dashboard from '../pages/Dashboard';

describe('StepControls', () => {
  it('navigates steps and resets', () => {
    const onChange = vi.fn();
    render(<StepControls index={1} total={4} onChange={onChange} />);
    expect(screen.getByTestId('step-label')).toHaveTextContent('Step 2 / 4');
    fireEvent.click(screen.getByLabelText('Next step')); expect(onChange).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByLabelText('Previous step')); expect(onChange).toHaveBeenCalledWith(0);
    fireEvent.click(screen.getByLabelText('Reset')); expect(onChange).toHaveBeenLastCalledWith(0);
  });
  it('disables prev on first step and next on last', () => {
    const { rerender } = render(<StepControls index={0} total={2} onChange={() => {}} />);
    expect(screen.getByLabelText('Previous step')).toBeDisabled();
    rerender(<StepControls index={1} total={2} onChange={() => {}} />);
    expect(screen.getByLabelText('Next step')).toBeDisabled();
  });
  it('plays and pauses', () => {
    render(<StepControls index={0} total={3} onChange={() => {}} />);
    fireEvent.click(screen.getByLabelText('Play')); expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });
});

describe('states', () => {
  it('shows error and empty states', () => {
    render(<><ErrorBox message="boom" /><Empty title="Nothing here" /></>);
    expect(screen.getByRole('alert')).toHaveTextContent('boom'); expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
  it('dashboard empty state', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('No graphs yet')).toBeInTheDocument(); expect(screen.getByTestId('stat-Saved graphs')).toHaveTextContent('0');
  });
  it('formats network and validation errors', () => {
    expect(errorMessage(new AxiosError('x'))).toMatch(/Cannot reach the API/);
    const e = new AxiosError('x', '400', undefined, undefined, { status: 400, data: { error: { message: 'Invalid request', details: [{ path: 'name', message: 'Required' }] } } } as any);
    expect(errorMessage(e)).toBe('Invalid request: name Required');
  });
});

describe('graph editor store', () => {
  it('adds nodes, connects, edits weight, maps to payload, ignores duplicates', () => {
    const s = useEditorStore.getState(); s.reset();
    s.addNode('A'); s.addNode('B');
    let st = useEditorStore.getState(); const [a, b] = st.nodes.map((n) => n.id);
    st.connect(a, b, 5); st.connect(b, a, 7); // duplicate in undirected graph
    st = useEditorStore.getState(); expect(st.edges).toHaveLength(1);
    st.setWeight(st.edges[0].id, 9);
    const p = useEditorStore.getState().payload();
    expect(p.nodes.map((n) => n.name)).toEqual(['A', 'B']); expect(p.edges).toEqual([{ source: a, destination: b, weight: 9 }]);
  });
  it('round-trips API graph through React Flow mapping', () => {
    const f = toFlow({ nodes: [{ externalId: 'A', name: 'A', x: 1, y: 2 }], edges: [] });
    expect(toPayload('g', false, f.nodes, f.edges).nodes[0]).toMatchObject({ externalId: 'A', x: 1, y: 2 });
  });
});

describe('walkPath', () => {
  it('reconstructs from next-hop matrix', () => {
    expect(walkPath(['A', 'B', 'C'], [[0, 1, 1], [null, 1, 2], [null, null, 2]], [[0, 1, 2], [null, 0, 1], [null, null, 0]], 'A', 'C')).toEqual(['A', 'B', 'C']);
  });
});
