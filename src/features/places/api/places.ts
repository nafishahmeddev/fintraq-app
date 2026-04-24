import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../../../db/client';
import { places, payments } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;

export function usePlaces() {
  return useQuery<Place[]>({
    queryKey: ['places'],
    queryFn: async () => {
      return await db.select().from(places).orderBy(places.name);
    },
  });
}

export function usePlaceById(id: number | null) {
  return useQuery<Place | null>({
    queryKey: ['places', id],
    queryFn: async () => {
      if (!id) return null;
      const results = await db.select().from(places).where(eq(places.id, id)).limit(1);
      return results[0] ?? null;
    },
    enabled: !!id,
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewPlace) => {
      await db.insert(places).values(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewPlace> }) => {
      await db.update(places).set({
        ...data,
        updatedAt: new Date().toISOString(),
      }).where(eq(places.id, id));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      queryClient.invalidateQueries({ queryKey: ['places', variables.id] });
    },
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await db.delete(places).where(eq(places.id, id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
}

export interface PlaceSummary {
  totalSpent: number;
  totalEarned: number;
  transactionCount: number;
}

export function usePlaceSummary(id: number | null) {
  return useQuery<PlaceSummary | null>({
    queryKey: ['places', 'summary', id],
    queryFn: async () => {
      if (!id) return null;

      const placePayments = await db.select({
        amount: payments.amount,
        type: payments.type,
      })
      .from(payments)
      .where(eq(payments.placeId, id));

      return placePayments.reduce((acc, p) => {
        if (p.type === 'DR') acc.totalSpent += p.amount;
        if (p.type === 'CR') acc.totalEarned += p.amount;
        acc.transactionCount += 1;
        return acc;
      }, { totalSpent: 0, totalEarned: 0, transactionCount: 0 });
    },
    enabled: !!id,
  });
}
