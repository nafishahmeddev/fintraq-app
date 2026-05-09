import React, { useCallback, useMemo } from 'react';
import { useGoals } from '../../features/goals/api/goals';
import { fromDbColor } from '../../utils/format';
import { EntityPickerItem, EntityPickerSheet } from './EntityPickerSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  accountId: number | null;
  onAddGoal?: () => void;
};

export const GoalPickerDialog = React.memo(function GoalPickerDialog({
  visible,
  onClose,
  selectedId,
  onSelect,
  accountId,
  onAddGoal,
}: Props) {
  const { data: goals = [], isLoading } = useGoals();

  const items: EntityPickerItem[] = useMemo(
    () =>
      goals
        .filter(
          g =>
            g.status === 'ACTIVE' &&
            (g.accountId === null || accountId === null || g.accountId === accountId),
        )
        .map(g => ({
          id: g.id,
          name: g.name,
          icon: g.icon ? `${g.icon}-outline` : 'flag-outline',
          color: fromDbColor(g.color),
        })),
    [goals, accountId],
  );

  const searchFilter = useCallback(
    (item: EntityPickerItem, query: string) => item.name.toLowerCase().includes(query),
    [],
  );

  return (
    <EntityPickerSheet
      visible={visible}
      onClose={onClose}
      title="Link to goal"
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      allowNull
      nullLabel="No goal"
      nullIcon="flag-outline"
      onAdd={onAddGoal}
      addIcon="add-circle-outline"
      searchPlaceholder="Search goals..."
      searchFilter={searchFilter}
      isLoading={isLoading}
    />
  );
});
