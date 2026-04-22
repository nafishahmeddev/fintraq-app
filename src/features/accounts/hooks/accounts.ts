import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/accounts';

export const ACCOUNTS_KEYS = {
  all: ['accounts'] as const,
  lists: () => [...ACCOUNTS_KEYS.all, 'list'] as const,
  details: () => [...ACCOUNTS_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...ACCOUNTS_KEYS.details(), id] as const,
};

export const useAccounts = () => {
  return useQuery({
    queryKey: ACCOUNTS_KEYS.lists(),
    queryFn: api.getAccounts,
  });
};

export const useAccountById = (id: number | null) => {
  return useQuery({
    queryKey: ACCOUNTS_KEYS.detail(id ?? 0),
    queryFn: () => (id ? api.getAccountById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<api.InsertAccount> }) => 
      api.updateAccount(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
