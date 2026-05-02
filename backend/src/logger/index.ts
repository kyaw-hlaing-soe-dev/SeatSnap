import pino from "pino";
import { getCorrelationId } from "../context/asyncContext";

type LogData = Record<string, unknown>;

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: { colorize: true },
        }
      : undefined,
});

function withCorrelationId(data?: LogData): LogData {
  const correlationId = getCorrelationId();
  if (!correlationId) {
    return data ?? {};
  }

  return { ...(data ?? {}), correlationId };
}

export const logger = {
  info: (msg: string, data?: LogData) => baseLogger.info(withCorrelationId(data), msg),
  warn: (msg: string, data?: LogData) => baseLogger.warn(withCorrelationId(data), msg),
  error: (msg: string, data?: LogData) => baseLogger.error(withCorrelationId(data), msg),
};
