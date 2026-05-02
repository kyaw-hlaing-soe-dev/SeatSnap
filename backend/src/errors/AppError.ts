export class AppError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super(message, 429, "RATE_LIMITED");
  }
}

export class InternalError extends AppError {
  constructor(message: string) {
    super(message, 500, "INTERNAL_ERROR");
  }
}
