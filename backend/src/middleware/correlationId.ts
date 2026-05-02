import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { runWithContext } from "../context/asyncContext";
import { logger } from "../logger";

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const headerValue = req.headers["x-correlation-id"];
  const correlationId = typeof headerValue === "string" ? headerValue : uuidv4();

  res.setHeader("x-correlation-id", correlationId);

  runWithContext(correlationId, () => {
    logger.info("Request received", { method: req.method, path: req.originalUrl });
    next();
  });
}
