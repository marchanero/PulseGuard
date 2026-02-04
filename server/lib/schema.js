import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('User', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  alias: text('alias').unique().notNull(),
  passwordHash: text('passwordHash').notNull(),
  createdAt: text('createdAt').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`),
  updatedAt: text('updatedAt').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`)
});

export const services = sqliteTable('Service', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').default('HTTP'),
  url: text('url').notNull(),
  host: text('host'),
  port: integer('port'),
  description: text('description'),
  tags: text('tags'), // JSON array of tags
  status: text('status').default('unknown'),
  responseTime: integer('responseTime'),
  uptime: real('uptime').default(100),
  lastChecked: text('lastChecked'),
  checkInterval: integer('checkInterval').default(60),
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  isDeleted: integer('isDeleted', { mode: 'boolean' }).default(false),
  isPublic: integer('isPublic', { mode: 'boolean' }).default(false),
  deletedAt: text('deletedAt'),
  totalMonitoredTime: integer('totalMonitoredTime').default(0),
  onlineTime: integer('onlineTime').default(0),
  createdAt: text('createdAt').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`),
  updatedAt: text('updatedAt').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`),
  contentMatch: text('contentMatch'),
  sslExpiryDate: text('sslExpiryDate'),
  sslDaysRemaining: integer('sslDaysRemaining'),
  dbType: text('dbType'),
  dbConnectionString: text('dbConnectionString')
});

export const serviceLogs = sqliteTable('ServiceLog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('serviceId').references(() => services.id, { onDelete: 'cascade' }),
  timestamp: text('timestamp').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`),
  status: text('status').notNull(),
  responseTime: integer('responseTime'),
  message: text('message')
});

export const performanceMetrics = sqliteTable('PerformanceMetric', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('serviceId').references(() => services.id, { onDelete: 'cascade' }),
  timestamp: text('timestamp').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`),
  responseTime: integer('responseTime').notNull(),
  status: text('status').notNull(),
  uptime: real('uptime').notNull()
});
