import { eq, sql, and, desc, sum } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, categories, payments, loans } from '../../../db/schema';

export type DashboardStats = {
  income: number;
  expense: number;
  totalSaved: number;
  totalDebt: number;
};

export const getDashboardStats = async (currency: string): Promise<DashboardStats> => {
  const statsQuery = db
    .select({
      income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
      expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(eq(accounts.currency, currency));

  const goalsQuery = db
    .select({
      total: sql<number>`SUM(${payments.amount})`
    })
    .from(payments)
    .where(sql`${payments.goalId} IS NOT NULL`);

  const [statsResult, goalsResult, allLoans] = await Promise.all([
    statsQuery,
    goalsQuery,
    db.select().from(loans)
  ]);

  let totalDebt = 0;
  for (const loan of allLoans) {
    const repaymentType = loan.type === 'BORROW' ? 'DR' : 'CR';
    const [repaymentResult] = await db
      .select({ paid: sql<number>`SUM(${payments.amount})` })
      .from(payments)
      .where(and(eq(payments.loanId, loan.id), eq(payments.type, repaymentType)));
    
    const paid = repaymentResult?.paid || 0;
    totalDebt += Math.max(0, loan.totalAmount - paid);
  }

  return {
    income: statsResult[0]?.income ?? 0,
    expense: statsResult[0]?.expense ?? 0,
    totalSaved: goalsResult[0]?.total ?? 0,
    totalDebt: totalDebt,
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
