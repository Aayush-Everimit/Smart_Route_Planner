import { useCallback, useEffect, useState } from 'react';
import { errorMessage, graphsApi } from '../api/client';
import type { GraphSummary } from '../types/api';

export function useGraphs() {
  const [graphs, setGraphs] = useState<GraphSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(() => {
    setLoading(true); setError(null);
    graphsApi.list().then(setGraphs).catch((e) => setError(errorMessage(e))).finally(() => setLoading(false));
  }, []);
  useEffect(reload, [reload]);
  return { graphs, loading, error, reload };
}
