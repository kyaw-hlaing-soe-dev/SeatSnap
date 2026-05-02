import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { ValidationError } from "../errors/AppError";
import { logger } from "../logger";

export function validate(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      logger.warn("Validation Error", { issues: result.error.issues });
      throw new ValidationError(result.error.message);
    }

    req.body = result.data;
    next();
  };
}
