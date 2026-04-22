import { db } from '../client';

export interface Seeder {
  name: string;
  run: () => Promise<void>;
}

function getSqliteClient() {
  return (db as unknown as { $client: { execSync: (sql: string) => void; runSync: (sql: string, ...params: unknown[]) => void; getFirstSync: <T>(sql: string, ...params: unknown[]) => T | null } }).$client;
}

function ensureSeedHistoryTable(): void {
  getSqliteClient().execSync(`
    CREATE TABLE IF NOT EXISTS __seed_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seeder_name TEXT NOT NULL UNIQUE,
      ran_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )
  `);
}

function hasSeederRun(name: string): boolean {
  const row = getSqliteClient().getFirstSync<{ id: number }>(
    'SELECT id FROM __seed_history WHERE seeder_name = ?',
    name,
  );
  return row !== null;
}

function markSeederAsRun(name: string): void {
  getSqliteClient().runSync(
    'INSERT OR IGNORE INTO __seed_history (seeder_name) VALUES (?)',
    name,
  );
}

export async function runSeeders(seeders: Seeder[]): Promise<void> {
  ensureSeedHistoryTable();

  for (const seeder of seeders) {
    if (hasSeederRun(seeder.name)) {
      console.log(`[Seeder] ${seeder.name}: already ran, skipping`);
      continue;
    }

    console.log(`[Seeder] ${seeder.name}: running...`);
    await seeder.run();
    markSeederAsRun(seeder.name);
    console.log(`[Seeder] ${seeder.name}: done`);
  }
}
