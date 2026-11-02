import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { env } from '../config/env';
import { AppError } from '../errors';

let _db: ReturnType<typeof make> | null = null;
const make = () => drizzle(neon(env.databaseUrl), { schema });
export type Db = ReturnType<typeof make>;

/** Lazy: creating the HTTP client is cheap and stateless (no connection is held). */
export function getDb(): Db {
  if (!env.databaseUrl) throw new AppError(500, 'DB_NOT_CONFIGURED', 'Database is not configured');
  return (_db ??= make());
}
