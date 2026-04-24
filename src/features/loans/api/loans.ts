import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../db/client';
import { accounts, loans } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getAllLoansProgress, getLoanProgressById } from '../services/loanQueries';

export function useLoansProgress() {
  return useQuery({
    queryKey: ['loansProgress'],
    queryFn: async () => {
      return await getAllLoansProgress();
    },
  });
}

export function useLoanProgress(id: number | null) {
  return useQuery({
    queryKey: ['loansProgress', id],
    queryFn: async () => {
      if (!id) return null;
      return await getLoanProgressById(id);
    },
    enabled: !!id,
  });
}

export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const results = await db.select({
        loan: loans,
        account: accounts,
      })
      .from(loans)
      .leftJoin(accounts, eq(loans.accountId, accounts.id));
      
      return results.map(r => ({
        ...r.loan,
        account: r.account,
      }));
    },
  });
}

export function useLoanById(id: number | null) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: async () => {
      if (!id) return null;
      const results = await db.select({
        loan: loans,
        account: accounts,
      })
      .from(loans)
      .leftJoin(accounts, eq(loans.accountId, accounts.id))
      .where(eq(loans.id, id))
      .limit(1);
      
      if (!results[0]) return null;
      return {
        ...results[0].loan,
        account: results[0].account,
      };
    },
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof loans.$inferInsert) => {
      await db.insert(loans).values(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loansProgress'] });
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof loans.$inferInsert> }) => {
      await db.update(loans).set({
        ...data,
        updatedAt: new Date().toISOString(),
      }).where(eq(loans.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loansProgress'] });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await db.delete(loans).where(eq(loans.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loansProgress'] });
    },
  });
}
