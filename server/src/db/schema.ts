import { pgTable, uuid, text, boolean, timestamp, doublePrecision, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const graphs = pgTable('graphs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  directed: boolean('directed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const nodes = pgTable('nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  graphId: uuid('graph_id').notNull().references(() => graphs.id, { onDelete: 'cascade' }),
  externalNodeId: text('external_node_id').notNull(),
  name: text('name').notNull(),
  xPosition: doublePrecision('x_position').notNull().default(0),
  yPosition: doublePrecision('y_position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('nodes_graph_external_uq').on(t.graphId, t.externalNodeId),
  index('nodes_graph_idx').on(t.graphId),
  check('nodes_external_id_nonempty', sql`length(${t.externalNodeId}) > 0`),
]);

export const edges = pgTable('edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  graphId: uuid('graph_id').notNull().references(() => graphs.id, { onDelete: 'cascade' }),
  sourceNodeId: uuid('source_node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  destinationNodeId: uuid('destination_node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  weight: doublePrecision('weight').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('edges_graph_src_dst_uq').on(t.graphId, t.sourceNodeId, t.destinationNodeId),
  index('edges_graph_idx').on(t.graphId),
]);
