import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../db/client';
import { people, payments, loans } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;

export function usePeople() {
  return useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: async () => {
      return await db.select().from(people).orderBy(people.name);
    },
  });
}

export function usePersonById(id: number | null) {
  return useQuery<Person | null>({
    queryKey: ['people', id],
    queryFn: async () => {
      if (!id) return null;
      const results = await db.select().from(people).where(eq(people.id, id)).limit(1);
      return results[0] ?? null;
    },
    enabled: !!id,
  });
}

export interface PersonSummary {
  income: number;
  expense: number;
  totalLent: number;
  remainingLent: number;
  totalBorrowed: number;
  remainingBorrowed: number;
  netPosition: number;
}

export function usePersonSummary(id: number | null) {
  return useQuery<PersonSummary | null>({
    queryKey: ['people', 'summary', id],
    queryFn: async () => {
      if (!id) return null;

      const personPayments = await db.select({
        amount: payments.amount,
        type: payments.type,
      })
      .from(payments)
      .where(eq(payments.personId, id));

      const personLoans = await db.select({
        totalAmount: loans.totalAmount,
        remainingAmount: loans.remainingAmount,
        type: loans.type,
      })
      .from(loans)
      .where(eq(loans.personId, id));

      const stats = personPayments.reduce((acc, p) => {
        if (p.type === 'CR') acc.income += p.amount;
        if (p.type === 'DR') acc.expense += p.amount;
        return acc;
      }, { income: 0, expense: 0 });

      const loanStats = personLoans.reduce((acc, l) => {
        if (l.type === 'LEND') {
          acc.totalLent += l.totalAmount;
          acc.remainingLent += l.remainingAmount;
        } else {
          acc.totalBorrowed += l.totalAmount;
          acc.remainingBorrowed += l.remainingAmount;
        }
        return acc;
      }, { totalLent: 0, remainingLent: 0, totalBorrowed: 0, remainingBorrowed: 0 });

      return {
        ...stats,
        ...loanStats,
        netPosition: loanStats.remainingLent - loanStats.remainingBorrowed,
      };
    },
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewPerson) => {
      await db.insert(people).values(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewPerson> }) => {
      await db.update(people).set({
        ...data,
        updatedAt: new Date().toISOString(),
      }).where(eq(people.id, id));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['people', variables.id] });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await db.delete(people).where(eq(people.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
}
