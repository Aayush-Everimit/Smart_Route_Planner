import { createApp } from './app';
import { env } from './config/env';
import { createDrizzleGraphRepository } from './repositories/drizzleGraphRepository';

createApp({ repo: createDrizzleGraphRepository() }).listen(env.port, () => console.log(`API on http://localhost:${env.port}`));
