# Algorithms

## Dijkstra (`engine/dijkstra.ts`)
Binary min-heap with lazy deletion (stale entries skipped when popped). Tracks distance, previous node, visit order. Rejects negative weights (`NEGATIVE_WEIGHT`). Equal-length paths: the first-discovered predecessor wins (strict `<`). Unreachable nodes have distance `null` (JSON-safe ∞). Optional steps: current node, distance snapshot, queue, relaxed edges (with `improved` flag), visited set. Time O((V+E) log V), space O(V).

## Floyd-Warshall (`engine/floydWarshall.ts`)
Triple loop over (k, i, j) with a next-hop matrix for path reconstruction. Supports negative edges; a negative value on the diagonal flags a negative cycle (`negativeCycle: true`, path reconstruction throws). Note that an undirected graph with a negative edge is itself a negative cycle. Optional steps: per-k matrix snapshot and updated cells. Time O(V³), space O(V²).

## Interfaces
Single-source (`SingleSourceResult`) and all-pairs (`AllPairsResult`) are separate types by design.

## Benchmark methodology
Graph loaded once (DB/HTTP excluded), one warm-up run, N trials (default 15, max 200) timed with `performance.now()`, median reported. Dijkstra is timed both single-source and as V runs for a like-for-like all-pairs comparison.
