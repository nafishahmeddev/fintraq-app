import { runSeeders } from './seed-runner';
import { transferCategoriesSeeder } from './transfer-categories.seeder';

// Register seeders in the order they should run.
// NEVER remove or reorder existing entries — only append new ones.
const SEEDERS = [
  transferCategoriesSeeder,
];

export async function runAllSeeders(): Promise<void> {
  await runSeeders(SEEDERS);
}
