import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import { createApiRouter } from './routes';
import { createGraphService } from './services/graphService';
import { createRouteService } from './services/routeService';
import type { GraphRepository } from './repositories/types';
import { docsHtml, openapi } from './openapi';

export function createApp(deps: { repo: GraphRepository; corsOrigins?: string[] }) {
  const app = express();
  const origins = deps.corsOrigins ?? env.corsOrigins;
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({
    // Requests with no Origin header (server-to-server, e.g. RideFlow backend) are allowed.
    origin: (origin, cb) => cb(null, !origin || origins.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));
  app.use(express.json({ limit: '256kb' }));
  app.use(rateLimit({ windowMs: 15 * 60_000, limit: 600, standardHeaders: true, legacyHeaders: false }));

  app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));
  app.get('/api/openapi.json', (_req, res) => res.json(openapi));
  app.get('/api/docs', (_req, res) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:; connect-src 'self'");
    res.type('html').send(docsHtml);
  });

  app.use('/api/v1', createApiRouter(createGraphService(deps.repo), createRouteService(deps.repo)));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
