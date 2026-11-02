/** Walk a Floyd-Warshall next-hop matrix (indices) to rebuild a path between two node ids. */
export function walkPath(nodes: string[], next: (number | null)[][], dist: (number | null)[][], s: string, t: string): string[] | null {
  const i = nodes.indexOf(s), j = nodes.indexOf(t);
  if (i < 0 || j < 0 || dist[i][j] === null) return null;
  const out = [s]; let c = i; let guard = nodes.length + 1;
  while (c !== j && guard-- > 0) { const n = next[c][j]; if (n === null) return null; c = n; out.push(nodes[c]); }
  return out;
}
