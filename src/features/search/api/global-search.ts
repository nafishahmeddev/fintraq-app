import { desc, eq, inArray, like, or } from 'drizzle-orm';
import { db } from '@/src/db/client';
import { accounts, categories, payments, people, places } from '@/src/db/schema';
import type { Account } from '@/src/features/accounts/api/accounts';
import type { Category } from '@/src/features/categories/api/categories';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';

export interface GlobalSearchResults {
  query: string;
  transactions: TransactionListItem[];
  accounts: Account[];
  categories: Category[];
}

const searchTransactions = async (
  query: string,
  limit = 12,
): Promise<TransactionListItem[]> => {
  const q = `%${query}%`;

  // LEFT JOIN categories so category name is searchable and available without a second query
  const rows = await db
    .select({
      id: payments.id,
      accountId: payments.accountId,
      toAccountId: payments.toAccountId,
      categoryId: payments.categoryId,
      amount: payments.amount,
      type: payments.type,
      datetime: payments.datetime,
      note: payments.note,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      account: {
        id: accounts.id,
        name: accounts.name,
        currency: accounts.currency,
        color: accounts.color,
      },
      category: {
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
      },
      person: {
        id: people.id,
        name: people.name,
        icon: people.icon,
        color: people.color,
      },
      personId: payments.personId,
      place: {
        id: places.id,
        name: places.name,
        icon: places.icon,
        color: places.color,
      },
      placeId: payments.placeId,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .leftJoin(categories, eq(payments.categoryId, categories.id))
    .leftJoin(people, eq(payments.personId, people.id))
    .leftJoin(places, eq(payments.placeId, places.id))
    .where(
      or(
        like(payments.note, q),
        like(accounts.name, q),
        like(categories.name, q),
        like(places.name, q),
      ),
    )
    .orderBy(desc(payments.datetime))
    .limit(limit);

  // Batch fetch toAccounts (transfers only) to avoid N+1
  const toAccountIds = [...new Set(rows.map(r => r.toAccountId).filter(Boolean))];
  const toAccountsResult = toAccountIds.length > 0
    ? await db.select({
        id: accounts.id,
        name: accounts.name,
        currency: accounts.currency,
        color: accounts.color,
      }).from(accounts).where(inArray(accounts.id, toAccountIds as number[]))
    : [];

  const toAccountMap = new Map(toAccountsResult.map(a => [a.id, a]));

  return rows.map(row => ({
    ...row,
    toAccount: row.toAccountId ? toAccountMap.get(row.toAccountId) ?? null : null,
    category: row.category?.id ? row.category : null,
    person: row.person?.id ? row.person : null,
    place: row.place?.id ? row.place : null,
  })) as TransactionListItem[];
};

const searchAccounts = async (query: string): Promise<Account[]> => {
  const q = `%${query}%`;
  return db
    .select()
    .from(accounts)
    .where(like(accounts.name, q))
    .limit(5);
};

const searchCategories = async (query: string): Promise<Category[]> => {
  const q = `%${query}%`;
  return db
    .select()
    .from(categories)
    .where(like(categories.name, q))
    .limit(10);
};

export const globalSearch = async (query: string): Promise<GlobalSearchResults> => {
  const trimmed = query.trim();
  const [txResults, acctResults, catResults] = await Promise.all([
    searchTransactions(trimmed),
    searchAccounts(trimmed),
    searchCategories(trimmed),
  ]);
  return { query: trimmed, transactions: txResults, accounts: acctResults, categories: catResults };
};
