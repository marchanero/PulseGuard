-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serviceId" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "uptime" REAL NOT NULL,
    CONSTRAINT "PerformanceMetric_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PerformanceMetric_serviceId_timestamp_idx" ON "PerformanceMetric"("serviceId", "timestamp");
