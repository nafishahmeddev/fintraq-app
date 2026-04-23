import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../db/client';
import { budgets } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getAllBudgetsProgress } from '../services/budgetQueries';

export function useBudgetsProgress() {
  return useQuery({
    queryKey: ['budgetsProgress'],
    queryFn: async () => {
      return await getAllBudgetsProgress();
    },
  });
}

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      return await db.select().from(budgets);
    },
  });
}

export function useBudgetById(id: number | null) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: async () => {
      if (!id) return null;
      const results = await db.select().from(budgets).where(eq(budgets.id, id)).limit(1);
      return results[0] ?? null;
    },
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof budgets.$inferInsert) => {
      await db.insert(budgets).values(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetsProgress'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof budgets.$inferInsert> }) => {
      await db.update(budgets).set({
        ...data,
        updatedAt: new Date().toISOString(),
      }).where(eq(budgets.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetsProgress'] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await db.delete(budgets).where(eq(budgets.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgetsProgress'] });
    },
  });
}
