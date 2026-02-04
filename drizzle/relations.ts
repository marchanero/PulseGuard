import { relations } from "drizzle-orm/relations";
import { service, serviceLog, performanceMetric } from "./schema";

export const serviceLogRelations = relations(serviceLog, ({one}) => ({
	service: one(service, {
		fields: [serviceLog.serviceId],
		references: [service.id]
	}),
}));

export const serviceRelations = relations(service, ({many}) => ({
	serviceLogs: many(serviceLog),
	performanceMetrics: many(performanceMetric),
}));

export const performanceMetricRelations = relations(performanceMetric, ({one}) => ({
	service: one(service, {
		fields: [performanceMetric.serviceId],
		references: [service.id]
	}),
}));