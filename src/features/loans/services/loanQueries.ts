import { db } from '../../../db/client';
import { accounts, loans, payments } from '../../../db/schema';
import { and, eq, sql } from 'drizzle-orm';

export interface LoanProgress {
  loanId: number;
  name: string;
  total: number;
  remaining: number;
  paid: number;
  percentage: number;
  type: 'LEND' | 'BORROW';
  status: string;
  currency: string;
}

export async function getAllLoansProgress(): Promise<LoanProgress[]> {
  const allLoans = await db.select({
    loan: loans,
    account: accounts,
  })
  .from(loans)
  .leftJoin(accounts, eq(loans.accountId, accounts.id));
  
  const progressPromises = allLoans.map(async ({ loan, account }) => {
    const repaymentType = loan.type === 'BORROW' ? 'DR' : 'CR';

    const result = await db.select({
      totalPaid: sql<number>`SUM(${payments.amount})`
    })
    .from(payments)
    .where(and(
      eq(payments.loanId, loan.id),
      eq(payments.type, repaymentType)
    ));

    const paid = result[0]?.totalPaid || 0;
    const total = loan.totalAmount;
    const remaining = Math.max(0, total - paid);
    const percentage = total > 0 ? (paid / total) * 100 : 0;

    return {
      loanId: loan.id,
      name: loan.name,
      total,
      remaining,
      paid,
      percentage,
      type: loan.type,
      status: loan.status,
      currency: account?.currency || 'USD' // Fallback if no account linked
    };
  });

  return Promise.all(progressPromises);
}

export async function getLoanProgressById(id: number): Promise<LoanProgress | null> {
  const loanResults = await db.select({
    loan: loans,
    account: accounts,
  })
  .from(loans)
  .leftJoin(accounts, eq(loans.accountId, accounts.id))
  .where(eq(loans.id, id))
  .limit(1);

  const data = loanResults[0];
  if (!data) return null;

  const { loan, account } = data;
  const repaymentType = loan.type === 'BORROW' ? 'DR' : 'CR';

  const result = await db.select({
    totalPaid: sql<number>`SUM(${payments.amount})`
  })
  .from(payments)
  .where(and(
    eq(payments.loanId, loan.id),
    eq(payments.type, repaymentType)
  ));

  const paid = result[0]?.totalPaid || 0;
  const total = loan.totalAmount;
  const remaining = Math.max(0, total - paid);
  const percentage = total > 0 ? (paid / total) * 100 : 0;

  return {
    loanId: loan.id,
    name: loan.name,
    total,
    remaining,
    paid,
    percentage,
    type: loan.type,
    status: loan.status,
    currency: account?.currency || 'USD'
  };
}
