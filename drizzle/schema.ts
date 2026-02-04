import { sqliteTable, AnySQLiteColumn, integer, text, real, index, foreignKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const user = sqliteTable("User", {
	id: integer().primaryKey({ autoIncrement: true }),
	username: text().notNull(),
	email: text().notNull(),
	alias: text().notNull(),
	passwordHash: text().notNull(),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
});

export const service = sqliteTable("Service", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	type: text().default("HTTP"),
	url: text().notNull(),
	host: text(),
	port: integer(),
	description: text(),
	status: text().default("unknown"),
	responseTime: integer(),
	uptime: real().default(100),
	lastChecked: text(),
	checkInterval: integer().default(60),
	isActive: integer().default(1),
	isDeleted: integer().default(0),
	deletedAt: text(),
	totalMonitoredTime: integer().default(0),
	onlineTime: integer().default(0),
	createdAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	updatedAt: text().default("sql`(CURRENT_TIMESTAMP)`"),
	contentMatch: text(),
	sslExpiryDate: text(),
	sslDaysRemaining: integer(),
	dbType: text(),
	dbConnectionString: text(),
	isPublic: integer().default(0),
});

export const serviceLog = sqliteTable("ServiceLog", {
	id: integer().primaryKey({ autoIncrement: true }),
	serviceId: integer().references(() => service.id, { onDelete: "cascade" } ),
	timestamp: text().default("sql`(CURRENT_TIMESTAMP)`"),
	status: text().notNull(),
	responseTime: integer(),
	message: text(),
},
(table) => [
	index("idx_service_log_timestamp").on(table.timestamp),
	index("idx_service_log_service_id").on(table.serviceId),
]);

export const performanceMetric = sqliteTable("PerformanceMetric", {
	id: integer().primaryKey({ autoIncrement: true }),
	serviceId: integer().references(() => service.id, { onDelete: "cascade" } ),
	timestamp: text().default("sql`(CURRENT_TIMESTAMP)`"),
	responseTime: integer().notNull(),
	status: text().notNull(),
	uptime: real().notNull(),
},
(table) => [
	index("idx_performance_metric_timestamp").on(table.timestamp),
	index("idx_performance_metric_service_id").on(table.serviceId),
]);

