import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { GraphError } from '../engine';
import { AppError } from '../errors';
import { env } from '../config/env';

export const asyncHandler = (fn: (...a: Parameters<RequestHandler>) => Promise<unknown>): RequestHandler => (req, res, next) => {
  fn(req, res, next).catch(next);
};

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, error: { code: 'ROUTE_NOT_FOUND', message: `Cannot ${req.method} ${req.path}` } });
};

const graphStatus: Record<string, number> = { DUPLICATE_NODE: 409, NODE_NOT_FOUND: 404, NEGATIVE_CYCLE: 422 };

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const send = (status: number, code: string, message: string, details?: unknown) =>
    res.status(status).json({ success: false, error: { code, message, ...(details ? { details } : {}) } });

  if (err instanceof ZodError) return send(400, 'VALIDATION_ERROR', 'Invalid request', err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  if (err instanceof AppError) return send(err.status, err.code, err.message, err.details);
  if (err instanceof GraphError) return send(graphStatus[err.code] ?? 400, err.code, err.message);
  if (err?.type === 'entity.too.large') return send(413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
  if (err?.type === 'entity.parse.failed') return send(400, 'INVALID_JSON', 'Malformed JSON body');

  // Safe logging: message only, never request bodies or connection strings.
  console.error('[unhandled]', err?.name, env.isProd ? '' : err?.message);
  return send(500, 'INTERNAL_ERROR', 'Something went wrong');
};
