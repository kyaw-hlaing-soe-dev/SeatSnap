import rateLimit from "express-rate-limit";
import RedisStore, { type RedisReply } from "rate-limit-redis";
import Redis from "ioredis";
import { RateLimitError } from "../errors/AppError";

const redisClient = new Redis({
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379)
});

const redisStore = new RedisStore({
  sendCommand: (...args: string[]): Promise<RedisReply> => {
    const [command, ...rest] = args;
    if (!command) {
      return Promise.reject(new Error("Redis command is required"));
    }
    return redisClient.call(command, rest) as Promise<RedisReply>;
  },
});

export const reserveRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  store: redisStore,
  keyGenerator: (req) => req.ip as string,
  handler: (req, res, next) => {
    next(new RateLimitError("Too many requests"));
  },
});
