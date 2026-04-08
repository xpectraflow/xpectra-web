const pino = require("pino");

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true }
  }
});

console.log("Starting logger test...");
logger.info({ test: "data" }, "Test log message");
console.log("Logger test complete.");
