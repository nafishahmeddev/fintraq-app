import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { budgets, payments } from '../../../db/schema';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, parseISO, addDays, addWeeks, addMonths, addYears } from 'date-fns';

export type BudgetProgress = {
  budgetId: number;
  spent: number;
  total: number;
  baseAmount: number;
  adjustment: number;
  remaining: number;
  percentage: number;
  isRolling: boolean;
};

function getPeriodDates(period: string, startDateStr: string | null, endDateStr: string | null): { start: string; end: string } {
  const now = new Date();
  
  if (period === 'CUSTOM' && startDateStr && endDateStr) {
    return { start: startDateStr, end: endDateStr };
  }

  switch (period) {
    case 'DAILY':
      return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
    case 'WEEKLY':
      return { start: startOfWeek(now, { weekStartsOn: 1 }).toISOString(), end: endOfWeek(now, { weekStartsOn: 1 }).toISOString() };
    case 'MONTHLY':
      return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
    case 'YEARLY':
      return { start: startOfYear(now).toISOString(), end: endOfYear(now).toISOString() };
    default:
      return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
  }
}

async function calculateSpentForPeriod(budgetRecord: any, start: string, end: string): Promise<number> {
  const accountIds: number[] = budgetRecord.accountIds ? JSON.parse(budgetRecord.accountIds) : [];
  let totalSpent = 0;

  if (budgetRecord.mode === 'MANUAL') {
    const conditions = [
      eq(payments.budgetId, budgetRecord.id),
      gte(payments.datetime, start),
      lte(payments.datetime, end)
    ];
    if (accountIds.length > 0) {
      conditions.push(inArray(payments.accountId, accountIds));
    }

    const result = await db.select({
      total: sql<number>`SUM(${payments.amount})`
    }).from(payments).where(and(...conditions));
    totalSpent = result[0]?.total || 0;
  } else {
    const categoryIds: number[] = budgetRecord.categoryIds ? JSON.parse(budgetRecord.categoryIds) : [];
    let categoryCondition = undefined;
    
    if (budgetRecord.scope === 'CATEGORY' && categoryIds.length > 0) {
      categoryCondition = inArray(payments.categoryId, categoryIds);
    } else if (budgetRecord.scope === 'OVERALL' && categoryIds.length > 0) {
      categoryCondition = sql`${payments.categoryId} NOT IN (${sql.join(categoryIds, sql`, `)})`;
    }

    const conditions = [
      eq(payments.type, budgetRecord.type as any),
      gte(payments.datetime, start),
      lte(payments.datetime, end)
    ];

    if (categoryCondition) conditions.push(categoryCondition);
    if (accountIds.length > 0) conditions.push(inArray(payments.accountId, accountIds));

    const result = await db.select({
      total: sql<number>`SUM(${payments.amount})`
    }).from(payments).where(and(...conditions));
    
    totalSpent = result[0]?.total || 0;
  }

  return totalSpent;
}

async function getRollingAdjustment(budgetRecord: any, currentStart: string): Promise<number> {
  if (!budgetRecord.isRolling || !budgetRecord.startDate || budgetRecord.period === 'CUSTOM') return 0;

  const budgetStart = parseISO(budgetRecord.startDate);
  const currentStartObj = parseISO(currentStart);
  
  if (currentStartObj <= budgetStart) return 0;

  let cumulativeAdjustment = 0;
  let periodStart = budgetStart;

  // Limit historical lookup to prevent performance issues (max 12 periods)
  let iterations = 0;
  const MAX_ITERATIONS = 24;

  while (periodStart < currentStartObj && iterations < MAX_ITERATIONS) {
    let periodEnd: Date;
    switch (budgetRecord.period) {
      case 'DAILY': periodEnd = endOfDay(periodStart); break;
      case 'WEEKLY': periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 }); break;
      case 'MONTHLY': periodEnd = endOfMonth(periodStart); break;
      case 'YEARLY': periodEnd = endOfYear(periodStart); break;
      default: periodEnd = endOfMonth(periodStart);
    }

    const spentInPeriod = await calculateSpentForPeriod(budgetRecord, periodStart.toISOString(), periodEnd.toISOString());
    cumulativeAdjustment += (budgetRecord.amount - spentInPeriod);

    switch (budgetRecord.period) {
      case 'DAILY': periodStart = addDays(periodStart, 1); break;
      case 'WEEKLY': periodStart = addWeeks(periodStart, 1); break;
      case 'MONTHLY': periodStart = addMonths(periodStart, 1); break;
      case 'YEARLY': periodStart = addYears(periodStart, 1); break;
      default: periodStart = addMonths(periodStart, 1);
    }
    iterations++;
  }

  return cumulativeAdjustment;
}

export async function getBudgetProgress(budgetId: number): Promise<BudgetProgress | null> {
  const budgetRecord = await db.query.budgets.findFirst({
    where: eq(budgets.id, budgetId),
  });

  if (!budgetRecord) return null;

  const { start, end } = getPeriodDates(budgetRecord.period, budgetRecord.startDate, budgetRecord.endDate);
  const totalSpent = await calculateSpentForPeriod(budgetRecord, start, end);
  const adjustment = await getRollingAdjustment(budgetRecord, start);
  const adjustedTotal = budgetRecord.amount + adjustment;

  return {
    budgetId: budgetRecord.id,
    spent: totalSpent,
    total: adjustedTotal,
    baseAmount: budgetRecord.amount,
    adjustment,
    remaining: Math.max(0, adjustedTotal - totalSpent),
    percentage: adjustedTotal > 0 ? (totalSpent / adjustedTotal) * 100 : 0,
    isRolling: budgetRecord.isRolling,
  };
}

export async function getAllBudgetsProgress(): Promise<BudgetProgress[]> {
  const allBudgets = await db.select().from(budgets);
  const progressList: BudgetProgress[] = [];
  
  for (const b of allBudgets) {
    const progress = await getBudgetProgress(b.id);
    if (progress) {
      progressList.push(progress);
    }
  }
  
  return progressList;
}
