import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../db/client';
import { goals } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getAllGoalsProgress, getGoalProgressById } from '../services/goalQueries';

export function useGoalsProgress() {
  return useQuery({
    queryKey: ['goalsProgress'],
    queryFn: async () => {
      return await getAllGoalsProgress();
    },
  });
}

export function useGoalProgress(id: number | null) {
  return useQuery({
    queryKey: ['goalsProgress', id],
    queryFn: async () => {
      if (!id) return null;
      return await getGoalProgressById(id);
    },
    enabled: !!id,
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      return await db.select().from(goals);
    },
  });
}

export function useGoalById(id: number | null) {
  return useQuery({
    queryKey: ['goals', id],
    queryFn: async () => {
      if (!id) return null;
      const results = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
      return results[0] ?? null;
    },
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: typeof goals.$inferInsert) => {
      await db.insert(goals).values(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goalsProgress'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof goals.$inferInsert> }) => {
      await db.update(goals).set({
        ...data,
        updatedAt: new Date().toISOString(),
      }).where(eq(goals.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goalsProgress'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await db.delete(goals).where(eq(goals.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goalsProgress'] });
    },
  });
}
