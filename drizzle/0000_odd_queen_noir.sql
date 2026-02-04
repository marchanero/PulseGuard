-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `User` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`alias` text NOT NULL,
	`passwordHash` text NOT NULL,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	`updatedAt` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `Service` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`type` text DEFAULT 'HTTP',
	`url` text NOT NULL,
	`host` text,
	`port` integer,
	`description` text,
	`status` text DEFAULT 'unknown',
	`responseTime` integer,
	`uptime` real DEFAULT 100,
	`lastChecked` text,
	`checkInterval` integer DEFAULT 60,
	`isActive` integer DEFAULT 1,
	`isDeleted` integer DEFAULT 0,
	`deletedAt` text,
	`totalMonitoredTime` integer DEFAULT 0,
	`onlineTime` integer DEFAULT 0,
	`createdAt` text DEFAULT (CURRENT_TIMESTAMP),
	`updatedAt` text DEFAULT (CURRENT_TIMESTAMP),
	`contentMatch` text,
	`sslExpiryDate` text,
	`sslDaysRemaining` integer,
	`dbType` text,
	`dbConnectionString` text,
	`isPublic` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `ServiceLog` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`serviceId` integer,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	`status` text NOT NULL,
	`responseTime` integer,
	`message` text,
	FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_service_log_timestamp` ON `ServiceLog` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_service_log_service_id` ON `ServiceLog` (`serviceId`);--> statement-breakpoint
CREATE TABLE `PerformanceMetric` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`serviceId` integer,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	`responseTime` integer NOT NULL,
	`status` text NOT NULL,
	`uptime` real NOT NULL,
	FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_performance_metric_timestamp` ON `PerformanceMetric` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_performance_metric_service_id` ON `PerformanceMetric` (`serviceId`);
*/