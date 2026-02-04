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
  dbConnectionString: text('dbConnectionString'),
  headers: text('headers') // JSON object with custom headers for requests
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

// ===== NOTIFICATION SYSTEM =====

// Notification channels (where to send notifications)
export const notificationChannels = sqliteTable('NotificationChannel', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'webhook', 'discord', 'slack', 'telegram', 'email'
  config: text('config').notNull(), // JSON with type-specific config
  isEnabled: integer('isEnabled', { mode: 'boolean' }).default(true),
  isDefault: integer('isDefault', { mode: 'boolean' }).default(false),
  createdAt: text('createdAt').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`),
  updatedAt: text('updatedAt').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`)
});

// Notification rules (when to notify)
export const notificationRules = sqliteTable('NotificationRule', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('serviceId').references(() => services.id, { onDelete: 'cascade' }),
  channelId: integer('channelId').references(() => notificationChannels.id, { onDelete: 'cascade' }),
  events: text('events').notNull(), // JSON array: ['down', 'up', 'degraded', 'ssl_expiry']
  threshold: integer('threshold').default(1), // Number of consecutive failures before alerting
  cooldown: integer('cooldown').default(300), // Seconds between repeated notifications
  isEnabled: integer('isEnabled', { mode: 'boolean' }).default(true),
  lastNotified: text('lastNotified'),
  consecutiveFailures: integer('consecutiveFailures').default(0),
  createdAt: text('createdAt').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`),
  updatedAt: text('updatedAt').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`)
});

// Notification history (log of sent notifications)
export const notificationHistory = sqliteTable('NotificationHistory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  channelId: integer('channelId').references(() => notificationChannels.id, { onDelete: 'set null' }),
  serviceId: integer('serviceId').references(() => services.id, { onDelete: 'set null' }),
  event: text('event').notNull(), // 'down', 'up', 'degraded', 'ssl_expiry', 'test'
  message: text('message').notNull(),
  status: text('status').notNull(), // 'sent', 'failed', 'pending'
  errorMessage: text('errorMessage'),
  metadata: text('metadata'), // JSON with additional data
  sentAt: text('sentAt').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`)
});

// ===== MAINTENANCE WINDOWS =====

// Maintenance windows to suppress alerts during planned maintenance
export const maintenanceWindows = sqliteTable('maintenance_windows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').references(() => services.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurringPattern: text('recurring_pattern'), // JSON: { type: 'daily|weekly|monthly', interval: 1, daysOfWeek: [] }
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdBy: text('created_by'),
  createdAt: text('created_at').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`),
  updatedAt: text('updated_at').default(sql`strftime('%Y-%m-%dT%H:%M:%S', 'now')`)
});
