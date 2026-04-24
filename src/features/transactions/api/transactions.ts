import { SQL, and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, categories, payments, people, places, TransactionType } from '../../../db/schema';

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type UpdatePayment = Omit<InsertPayment, 'id'>;

export const PAGE_SIZE = 20;

export type TransactionFilters = {
  type?: TransactionType;
  accountId?: number;
  categoryId?: number;
  budgetId?: number;
  goalId?: number;
  loanId?: number;
  personId?: number;
  placeId?: number;
};

export type TransactionListItem = {
  id: number;
  accountId: number;
  toAccountId: number | null;
  categoryId: number | null;
  amount: number;
  type: TransactionType;
  datetime: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  account: {
    id: number;
    name: string;
    currency: string;
    color: number;
  };
  toAccount: {
    id: number;
    name: string;
    currency: string;
    color: number;
  } | null;
  category: {
    id: number;
    name: string;
    icon: string;
    color: number;
  } | null;
  person: {
    id: number;
    name: string;
    icon: string;
    color: number;
  } | null;
  place: {
    id: number;
    name: string;
    icon: string;
    color: number;
  } | null;
};

const buildWhere = (filters: TransactionFilters): SQL | undefined => {
  const conditions: SQL[] = [];
  if (filters.type) conditions.push(eq(payments.type, filters.type));
  if (filters.accountId != null) conditions.push(eq(payments.accountId, filters.accountId));
  if (filters.categoryId != null) conditions.push(eq(payments.categoryId, filters.categoryId));
  if (filters.budgetId != null) conditions.push(eq(payments.budgetId, filters.budgetId));
  if (filters.goalId != null) conditions.push(eq(payments.goalId, filters.goalId));
  if (filters.loanId != null) conditions.push(eq(payments.loanId, filters.loanId));
  if (filters.personId != null) conditions.push(eq(payments.personId, filters.personId));
  if (filters.placeId != null) conditions.push(eq(payments.placeId, filters.placeId));
  return conditions.length > 0 ? and(...conditions) : undefined;
};

export const getTransactionsPaged = async (
  page: number,
  filters: TransactionFilters = {},
): Promise<TransactionListItem[]> => {
  const where = buildWhere(filters);

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
      personId: payments.personId,
      placeId: payments.placeId,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      account: {
        id: accounts.id,
        name: accounts.name,
        currency: accounts.currency,
        color: accounts.color,
      },
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(where)
    .orderBy(desc(payments.datetime))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE);

  return fetchRelatedData(rows);
};

/**
 * Helper to batch fetch related accounts and categories for transactions
 * Avoids N+1 query issues by fetching all related data in parallel
 */
type RawTransactionRow = Omit<TransactionListItem, 'toAccount' | 'category' | 'person' | 'place'> & {
  toAccountId: number | null;
  categoryId: number | null;
  personId: number | null;
  placeId: number | null;
};

const fetchRelatedData = async (rows: RawTransactionRow[]): Promise<TransactionListItem[]> => {
  const toAccountIds = [...new Set(rows.map(r => r.toAccountId).filter(Boolean))];
  const categoryIds = [...new Set(rows.map(r => r.categoryId).filter(Boolean))];
  const personIds = [...new Set(rows.map(r => r.personId).filter(Boolean))];
  const placeIds = [...new Set(rows.map(r => r.placeId).filter(Boolean))];

  const [toAccounts, allCategories, allPeople, allPlaces] = await Promise.all([
    toAccountIds.length > 0
      ? db.select({
          id: accounts.id,
          name: accounts.name,
          currency: accounts.currency,
          color: accounts.color,
        }).from(accounts).where(inArray(accounts.id, toAccountIds as number[]))
      : Promise.resolve([]),
    categoryIds.length > 0
      ? db.select({
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
        }).from(categories).where(inArray(categories.id, categoryIds as number[]))
      : Promise.resolve([]),
    personIds.length > 0
      ? db.select({
          id: people.id,
          name: people.name,
          icon: people.icon,
          color: people.color,
        }).from(people).where(inArray(people.id, personIds as number[]))
      : Promise.resolve([]),
    placeIds.length > 0
      ? db.select({
          id: places.id,
          name: places.name,
          icon: places.icon,
          color: places.color,
        }).from(places).where(inArray(places.id, placeIds as number[]))
      : Promise.resolve([]),
  ]);

  const toAccountMap = new Map(toAccounts.map(a => [a.id, a]));
  const categoryMap = new Map(allCategories.map(c => [c.id, c]));
  const personMap = new Map(allPeople.map(p => [p.id, p]));
  const placeMap = new Map(allPlaces.map(p => [p.id, p]));

  return rows.map(row => ({
    ...row,
    toAccount: row.toAccountId ? toAccountMap.get(row.toAccountId) ?? null : null,
    category: row.categoryId ? categoryMap.get(row.categoryId) ?? null : null,
    person: row.personId ? personMap.get(row.personId) ?? null : null,
    place: row.placeId ? placeMap.get(row.placeId) ?? null : null,
  })) as TransactionListItem[];
};

export const getTransactionsCount = async (filters: TransactionFilters = {}) => {
  const where = buildWhere(filters);
  const [row] = await db.select({ total: count() }).from(payments).where(where);
  return row?.total ?? 0;
};

/** Fetch recent transactions with limit and optional filters */
export const getTransactions = async (limit: number = 10, filters: TransactionFilters = {}): Promise<TransactionListItem[]> => {
  const where = buildWhere(filters);
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
      personId: payments.personId,
      placeId: payments.placeId,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      account: {
        id: accounts.id,
        name: accounts.name,
        currency: accounts.currency,
        color: accounts.color,
      },
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(where)
    .orderBy(desc(payments.datetime))
    .limit(limit);

  return fetchRelatedData(rows);
};

export const getTransactionById = async (id: number): Promise<Payment | null> => {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, id))
    .limit(1);

  return payment ?? null;
};

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type BalancePayload = {
  type: TransactionType;
  accountId: number;
  toAccountId?: number | null;
  amount: number;
};

/**
 * CR  → balance +amount, income +amount
 * DR  → balance -amount, expense +amount
 * TRANSFER → source balance -amount, destination balance +amount (no income/expense impact)
 *
 * Pass direction=1 when creating, direction=-1 when reversing (delete / update undo).
 */
async function applyBalanceDelta(tx: Tx, p: BalancePayload, direction: 1 | -1): Promise<void> {
  const amt = p.amount * direction;

  if (p.type === 'CR') {
    await tx.update(accounts)
      .set({
        balance: sql`${accounts.balance} + ${amt}`,
        income:  sql`${accounts.income}  + ${amt}`,
      })
      .where(eq(accounts.id, p.accountId));

  } else if (p.type === 'DR') {
    await tx.update(accounts)
      .set({
        balance: sql`${accounts.balance} - ${amt}`,
        expense: sql`${accounts.expense} + ${amt}`,
      })
      .where(eq(accounts.id, p.accountId));

  } else {
    // TRANSFER
    if (!p.toAccountId) throw new Error('TRANSFER requires toAccountId');
    await tx.update(accounts)
      .set({ balance: sql`${accounts.balance} - ${amt}` })
      .where(eq(accounts.id, p.accountId));
    await tx.update(accounts)
      .set({ balance: sql`${accounts.balance} + ${amt}` })
      .where(eq(accounts.id, p.toAccountId));
  }
}

export const createTransaction = async (data: InsertPayment) => {
  return await db.transaction(async (tx) => {
    const [payment] = await tx.insert(payments).values(data).returning();
    await applyBalanceDelta(tx, data, 1);
    return payment;
  });
};

export const deleteTransaction = async (id: number) => {
  return await db.transaction(async (tx) => {
    const [payment] = await tx.select().from(payments).where(eq(payments.id, id));
    if (!payment) return null;
    await applyBalanceDelta(tx, payment, -1);
    return await tx.delete(payments).where(eq(payments.id, id));
  });
};

export const updateTransaction = async (id: number, data: UpdatePayment) => {
  return await db.transaction(async (tx) => {
    const [oldPayment] = await tx.select().from(payments).where(eq(payments.id, id));
    if (!oldPayment) throw new Error('Transaction not found');
    await applyBalanceDelta(tx, oldPayment, -1);
    await applyBalanceDelta(tx, data, 1);
    const [updated] = await tx.update(payments).set(data).where(eq(payments.id, id)).returning();
    return updated;
  });
};
