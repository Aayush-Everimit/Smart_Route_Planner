import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

export const validate = (s: { body?: ZodTypeAny; params?: ZodTypeAny }): RequestHandler => (req, _res, next) => {
  try {
    if (s.params) req.params = s.params.parse(req.params);
    if (s.body) req.body = s.body.parse(req.body);
    next();
  } catch (e) { next(e); }
};
