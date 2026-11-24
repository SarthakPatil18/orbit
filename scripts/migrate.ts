import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }
  const client = postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => undefined,
  });
  const db = drizzle(client);
  await migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
  await client.end({ timeout: 5 });
  console.log("Migrations applied successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});