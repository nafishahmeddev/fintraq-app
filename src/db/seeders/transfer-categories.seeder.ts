import { eq } from 'drizzle-orm';
import { db } from '../client';
import { categories } from '../schema';
import { toDbColor } from '../../utils/format';
import type { Seeder } from './seed-runner';

const SEED_DATA = [
  { name: 'Account Transfer', icon: 'swap-horizontal-outline', color: toDbColor('#818CF8'), type: 'TRANSFER' as const },
  { name: 'Self Transfer',    icon: 'arrow-forward-outline',   color: toDbColor('#34D399'), type: 'TRANSFER' as const },
  { name: 'Balance Transfer', icon: 'repeat-outline',          color: toDbColor('#FBBF24'), type: 'TRANSFER' as const },
];

async function run(): Promise<void> {
  for (const item of SEED_DATA) {
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, item.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(categories).values(item);
    }
  }
}

export const transferCategoriesSeeder: Seeder = {
  name: 'transfer-categories-v1',
  run,
};
