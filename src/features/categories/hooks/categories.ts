import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/categories';

export const CATEGORIES_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORIES_KEYS.all, 'list'] as const,
  details: () => [...CATEGORIES_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...CATEGORIES_KEYS.details(), id] as const,
};

export const useCategories = () => {
  return useQuery({
    queryKey: CATEGORIES_KEYS.lists(),
    queryFn: api.getCategories,
  });
};

export const useCategoryById = (id: number | null) => {
  return useQuery({
    queryKey: CATEGORIES_KEYS.detail(id ?? 0),
    queryFn: () => (id ? api.getCategoryById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<api.InsertCategory> }) => 
      api.updateCategory(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
