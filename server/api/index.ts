// Vercel serverless entry: the Express app is exported as the request handler.
import { createApp } from '../src/app';
import { createDrizzleGraphRepository } from '../src/repositories/drizzleGraphRepository';

export default createApp({ repo: createDrizzleGraphRepository() });
