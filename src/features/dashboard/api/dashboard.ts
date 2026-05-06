import { and, eq, sql, desc, sum, isNotNull } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, categories, payments, people, places } from '../../../db/schema';

export type DashboardStats = {
  income: number;
  expense: number;
};

export const getDashboardStats = async (currency: string): Promise<DashboardStats> => {
  const [result] = await db
    .select({
      income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
      expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(eq(accounts.currency, currency));

  return {
    income: result?.income ?? 0,
    expense: result?.expense ?? 0,
  };
};

export type CategorySpend = {
  id: number;
  name: string;
  icon: string;
  color: number;
  amount: number;
};

export const getTopExpenseCategories = async (currency: string, limit: number = 5): Promise<CategorySpend[]> => {
  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      amount: sum(payments.amount).mapWith(Number),
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .where(and(eq(accounts.currency, currency), eq(payments.type, 'DR')))
    .groupBy(categories.id)
    .orderBy(desc(sql`amount`))
    .limit(limit);

  return result as CategorySpend[];
};

export type PeopleSummary = {
  count: number;
  totalSpent: number;
};

export const getPeopleSpending = async (currency: string): Promise<PeopleSummary> => {
  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(people);
  const count = countResult[0]?.count ?? 0;

  const spendResult = await db
    .select({ total: sql<number>`SUM(${payments.amount})` })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), eq(payments.type, 'DR'), isNotNull(payments.personId)));

  return { count, totalSpent: spendResult[0]?.total ?? 0 };
};

export type PlacesSummary = {
  count: number;
  totalSpent: number;
};

export const getPlacesSpending = async (currency: string): Promise<PlacesSummary> => {
  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(places);
  const count = countResult[0]?.count ?? 0;

  const spendResult = await db
    .select({ total: sql<number>`SUM(${payments.amount})` })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(and(eq(accounts.currency, currency), eq(payments.type, 'DR'), isNotNull(payments.placeId)));

  return { count, totalSpent: spendResult[0]?.total ?? 0 };
};

export type MonthlyComparison = {
  thisMonth: { income: number; expense: number };
  lastMonth: { income: number; expense: number };
};

export const getMonthlyComparison = async (currency: string): Promise<MonthlyComparison> => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);

  const periodExpr = sql<string>`CASE WHEN date(${payments.datetime}) >= ${thisMonthStart} THEN 'this' ELSE 'last' END`;

  const rows = await db
    .select({
      income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
      expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
      month: periodExpr,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(
      and(
        eq(accounts.currency, currency),
        sql`date(${payments.datetime}) >= ${lastMonthStart}`,
        sql`date(${payments.datetime}) < ${nextMonthStart}`,
      ),
    )
    .groupBy(periodExpr);

  const thisMonth = { income: 0, expense: 0 };
  const lastMonth = { income: 0, expense: 0 };

  for (const row of rows) {
    if (row.month === 'this') {
      thisMonth.income = Number(row.income) || 0;
      thisMonth.expense = Number(row.expense) || 0;
    } else {
      lastMonth.income = Number(row.income) || 0;
      lastMonth.expense = Number(row.expense) || 0;
    }
  }

  return { thisMonth, lastMonth };
};
