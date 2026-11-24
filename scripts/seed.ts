import { createStore } from "../src/lib/database";

async function main(): Promise<void> {
  const reset = process.argv.includes("--reset");
  const store = await createStore();
  if (reset || store.kind === "postgres") {
    // Postgres must be seeded explicitly; file store seeds itself on first init.
    await store.reset();
    console.log(`Seeded ${store.kind} store${reset ? " (reset)" : ""}.`);
  } else {
    await store.init();
    console.log("File store initialized (seeded if missing).");
  }
  await store.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});