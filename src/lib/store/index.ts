import path from "node:path";
import { getRuntimeConfig } from "@/lib/env";
import { FileStore } from "./file-store";
import { PostgresStore } from "./postgres-store";
import type { Store } from "./types";

interface StoreGlobal {
  __proofdeskStore?: Promise<Store>;
  __proofdeskTestStore?: Store;
}

const globalStore = globalThis as unknown as StoreGlobal;

export function setStoreForTests(store: Store): void {
  globalStore.__proofdeskTestStore = store;
}

export function clearStoreCache(): void {
  globalStore.__proofdeskStore = undefined;
  globalStore.__proofdeskTestStore = undefined;
}

export async function createStore(): Promise<Store> {
  const config = getRuntimeConfig();
  if (config.storageDriver === "postgres") {
    const store = new PostgresStore();
    try {
      await store.init();
      return store;
    } catch (error) {
      await store.close().catch(() => undefined);
      if (process.env.STORAGE_DRIVER === "postgres") {
        throw new Error(
          `PostgreSQL storage is required (STORAGE_DRIVER=postgres) but could not be reached. Run npm run db:migrate && npm run db:seed. ${
            error instanceof Error ? error.message : ""
          }`,
        );
      }
      console.warn(
        "[proofdesk] PostgreSQL unavailable; using the durable file adapter for this instance.",
        error instanceof Error ? error.message : error,
      );
    }
  }
  const file = new FileStore({
    dataDir: path.resolve(/*turbopackIgnore: true*/ process.cwd(), config.dataDir),
  });
  await file.init();
  return file;
}

export function getStore(): Promise<Store> {
  if (globalStore.__proofdeskTestStore) {
    return Promise.resolve(globalStore.__proofdeskTestStore);
  }
  if (!globalStore.__proofdeskStore) {
    globalStore.__proofdeskStore = createStore();
  }
  return globalStore.__proofdeskStore;
}

export type { Store };
