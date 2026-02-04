// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/lib/schema.js",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL!,     // <- sin comillas, es una expresión
    authToken: process.env.TURSO_AUTH_TOKEN, // opcional si usas file: local
  },
  strict: true,
  verbose: true,
});
