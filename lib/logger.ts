import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: ["password", "token", "accessToken", "refreshToken", "cookie", "authorization"],
    censor: "**REDACTED**",
  },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "HH:MM:ss Z",
        },
      }
    : undefined,
});
