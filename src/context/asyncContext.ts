import { AsyncLocalStorage } from "node:async_hooks";

type ContextStore = Map<string, string>;

export const asyncLocalStorage = new AsyncLocalStorage<ContextStore>();

export function runWithContext<T>(correlationId: string, fn: () => T): T {
  const store = new Map<string, string>([["correlationId", correlationId]]);
  return asyncLocalStorage.run(store, fn);
}

export function getCorrelationId(): string | undefined {
  return asyncLocalStorage.getStore()?.get("correlationId");
}
