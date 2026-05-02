import { AsyncLocalStorage } from "node:async_hooks";

type ContextStore = Map<string, string>;

export const storage = new AsyncLocalStorage<ContextStore>();

export function runWithContext(correlationId: string, fn: () => void): void {
  const store = new Map<string, string>([["correlationId", correlationId]]);
  storage.run(store, fn);
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.get("correlationId");
}
