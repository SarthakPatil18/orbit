import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FileStore } from "@/lib/store/file-store";
import { setStoreForTests, clearStoreCache } from "@/lib/store";

export async function makeTempStore() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "proofdesk-"));
  const store = new FileStore({ dataDir: dir });
  await store.init();
  setStoreForTests(store);
  return { store, dir, cleanup: async () => {
    clearStoreCache();
    await rm(dir, { recursive: true, force: true });
  } };
}