import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../db/client';
import { recurringTransactions, accounts, categories } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export type RecurringTransactionWithRelations = typeof recurringTransactions.$inferSelect & {
  account: typeof accounts.$inferSelect | null;
  category: typeof categories.$inferSelect | null;
};

export function useRecurringTransactions() {
  return useQuery({
    queryKey: ['recurringTransactions'],
    queryFn: async () => {
      const results = await db.select({
        recurring: recurringTransactions,
        account: accounts,
        category: categories,
      })
      .from(recurringTransactions)
      .leftJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
      .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id));

      return results.map((r) => ({
        ...r.recurring,
        account: r.account,
        category: r.category,
      })) as RecurringTransactionWithRelations[];
    },
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await db.delete(recurringTransactions).where(eq(recurringTransactions.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    },
  });
}

export function useToggleRecurringPause() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPaused }: { id: number; isPaused: boolean }) => {
      await db.update(recurringTransactions)
        .set({ isPaused })
        .where(eq(recurringTransactions.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    },
  });
}

export function useRecurringById(id: number | null) {
  return useQuery({
    queryKey: ['recurringTransactions', id],
    queryFn: async () => {
      if (!id) return null;
      const results = await db.select({
        recurring: recurringTransactions,
        account: accounts,
        category: categories,
      })
      .from(recurringTransactions)
      .leftJoin(accounts, eq(recurringTransactions.accountId, accounts.id))
      .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
      .where(eq(recurringTransactions.id, id))
      .limit(1);

      if (!results.length) return null;
      const r = results[0];
      return {
        ...r.recurring,
        account: r.account,
        category: r.category,
      } as RecurringTransactionWithRelations;
    },
    enabled: !!id,
  });
}

export function useCreateRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof recurringTransactions.$inferInsert) => {
      const result = await db.insert(recurringTransactions).values(data).returning();
      return result[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    },
  });
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof recurringTransactions.$inferInsert> }) => {
      const result = await db.update(recurringTransactions).set({
        ...data,
        updatedAt: new Date().toISOString(),
      }).where(eq(recurringTransactions.id, id)).returning();
      return result[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    },
  });
}
