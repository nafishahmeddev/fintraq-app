import React, { useMemo } from 'react';
import { usePeople } from '../../features/people/api/people';
import { fromDbColor } from '../../utils/format';
import { EntityPickerItem, EntityPickerSheet } from './EntityPickerSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  title?: string;
  onAddPerson?: () => void;
};

export const PersonPickerDialog = React.memo(function PersonPickerDialog({
  visible,
  onClose,
  selectedId,
  onSelect,
  title = 'Select person',
  onAddPerson,
}: Props) {
  const { data: people = [], isLoading } = usePeople();

  const items: EntityPickerItem[] = useMemo(
    () =>
      people.map(p => ({
        id: p.id,
        name: p.name,
        subtitle: p.phone ?? null,
        icon: p.icon ? `${p.icon}-outline` : 'person-outline',
        color: fromDbColor(p.color),
      })),
    [people],
  );

  return (
    <EntityPickerSheet
      visible={visible}
      onClose={onClose}
      title={title}
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      allowNull
      nullLabel="No person"
      nullIcon="people-outline"
      onAdd={onAddPerson}
      addIcon="person-add-outline"
      searchPlaceholder="Search people..."
      isLoading={isLoading}
    />
  );
});
