import { logger } from "./lib/logger";

console.log("Starting logger test...");
logger.info({ test: "data" }, "Test log message");
logger.error(new Error("Test error"), "Test error message");
console.log("Logger test complete.");
