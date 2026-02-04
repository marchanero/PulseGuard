import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Tabla de usuarios
export const users = sqliteTable('User', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull(),
  email: text('email').notNull(),
  alias: text('alias').notNull(),
  passwordHash: text('passwordHash').notNull(),
  createdAt: text('createdAt').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updatedAt').default(sql`(CURRENT_TIMESTAMP)`),
});

// Tabla de servicios
export const services = sqliteTable('Service', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').default('HTTP'),
  url: text('url').notNull(),
  host: text('host'),
  port: integer('port'),
  description: text('description'),
  status: text('status').default('unknown'),
  responseTime: integer('responseTime'),
  uptime: real('uptime').default(100),
  lastChecked: text('lastChecked'),
  checkInterval: integer('checkInterval').default(60),
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  isDeleted: integer('isDeleted', { mode: 'boolean' }).default(false),
  deletedAt: text('deletedAt'),
  totalMonitoredTime: integer('totalMonitoredTime').default(0),
  onlineTime: integer('onlineTime').default(0),
  createdAt: text('createdAt').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updatedAt').default(sql`(CURRENT_TIMESTAMP)`),
  contentMatch: text('contentMatch'),
  sslExpiryDate: text('sslExpiryDate'),
  sslDaysRemaining: integer('sslDaysRemaining'),
  dbType: text('dbType'),
  dbConnectionString: text('dbConnectionString'),
  isPublic: integer('isPublic', { mode: 'boolean' }).default(false),
});

// Tabla de logs de servicios
export const serviceLogs = sqliteTable('ServiceLog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('serviceId').references(() => services.id, { onDelete: 'cascade' }),
  timestamp: text('timestamp').default(sql`(CURRENT_TIMESTAMP)`),
  status: text('status').notNull(),
  responseTime: integer('responseTime'),
  message: text('message'),
}, (table) => [
  index('idx_service_log_timestamp').on(table.timestamp),
  index('idx_service_log_service_id').on(table.serviceId),
]);

// Tabla de métricas de rendimiento
export const performanceMetrics = sqliteTable('PerformanceMetric', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('serviceId').references(() => services.id, { onDelete: 'cascade' }),
  timestamp: text('timestamp').default(sql`(CURRENT_TIMESTAMP)`),
  responseTime: integer('responseTime').notNull(),
  status: text('status').notNull(),
  uptime: real('uptime').notNull(),
}, (table) => [
  index('idx_performance_metric_timestamp').on(table.timestamp),
  index('idx_performance_metric_service_id').on(table.serviceId),
]);
