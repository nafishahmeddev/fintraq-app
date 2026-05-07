import React, { useCallback, useMemo } from 'react';
import { TransactionType } from '../../db/schema';
import { useLoans } from '../../features/loans/api/loans';
import { fromDbColor } from '../../utils/format';
import { EntityPickerItem, EntityPickerSheet } from './EntityPickerSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  accountId: number | null;
  transactionType: TransactionType;
  onAddLoan?: () => void;
};

export const LoanPickerDialog = React.memo(function LoanPickerDialog({
  visible,
  onClose,
  selectedId,
  onSelect,
  accountId,
  transactionType,
  onAddLoan,
}: Props) {
  const { data: loans = [], isLoading } = useLoans();

  const items: EntityPickerItem[] = useMemo(
    () =>
      loans
        .filter(l => {
          const isActive = l.status === 'ACTIVE';
          const isCorrectType =
            (transactionType === 'DR' && l.type === 'BORROW') ||
            (transactionType === 'CR' && l.type === 'LEND');
          const isCorrectAccount =
            l.accountId === null || accountId === null || l.accountId === accountId;
          return isActive && isCorrectType && isCorrectAccount;
        })
        .map(l => ({
          id: l.id,
          name: l.name,
          subtitle: l.type === 'BORROW' ? 'Borrowed' : 'Lent',
          icon: l.icon ? `${l.icon}-outline` : 'cash-outline',
          color: fromDbColor(l.color),
        })),
    [loans, accountId, transactionType],
  );

  const searchFilter = useCallback(
    (item: EntityPickerItem, query: string) => item.name.toLowerCase().includes(query),
    [],
  );

  return (
    <EntityPickerSheet
      visible={visible}
      onClose={onClose}
      title="Link to loan"
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      allowNull
      nullLabel="No loan"
      nullIcon="cash-outline"
      onAdd={onAddLoan}
      addIcon="add-circle-outline"
      searchPlaceholder="Search loans..."
      searchFilter={searchFilter}
      isLoading={isLoading}
    />
  );
});
