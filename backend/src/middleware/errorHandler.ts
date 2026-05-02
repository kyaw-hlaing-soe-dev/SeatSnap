import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { getCorrelationId } from "../context/asyncContext";
import { logger } from "../logger";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const correlationId = getCorrelationId();
  const message = err instanceof Error ? err.message : "Unknown error";
  const stack = err instanceof Error ? err.stack : undefined;

  logger.error("Error", { stack, message, method: req.method, path: req.originalUrl });

  if (err instanceof AppError) {
    logger.warn("Error response sent", {
      status: err.statusCode,
      error: err.errorCode,
      message: err.message,
    });
    res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
      ref: correlationId,
    });
    return;
  }

  logger.error("Error response sent", {
    status: 500,
    error: "INTERNAL_ERROR",
  });
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "Something went wrong",
    ref: correlationId,
  });
}
