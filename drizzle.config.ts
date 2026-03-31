import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  tablesFilter: ["!hyper_*"],
  dbCredentials: {
    url: process.env.DATABASE_URL as string
  },
});
