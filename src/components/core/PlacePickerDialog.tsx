import React, { useCallback, useMemo } from 'react';
import { usePlaces } from '../../features/places/api/places';
import { fromDbColor } from '../../utils/format';
import { EntityPickerItem, EntityPickerSheet } from './EntityPickerSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  title?: string;
  onAddPlace?: () => void;
};

export const PlacePickerDialog = React.memo(function PlacePickerDialog({
  visible,
  onClose,
  selectedId,
  onSelect,
  title = 'Select place',
  onAddPlace,
}: Props) {
  const { data: places = [], isLoading } = usePlaces();

  const items: EntityPickerItem[] = useMemo(
    () =>
      places.map(p => ({
        id: p.id,
        name: p.name,
        subtitle: p.description ?? null,
        icon: p.icon ? `${p.icon}-outline` : 'location-outline',
        color: fromDbColor(p.color),
      })),
    [places],
  );

  const searchFilter = useCallback(
    (item: EntityPickerItem, query: string) =>
      item.name.toLowerCase().includes(query) ||
      (item.subtitle?.toLowerCase().includes(query) ?? false),
    [],
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
      nullLabel="No place"
      nullIcon="location-outline"
      onAdd={onAddPlace}
      addIcon="add-circle-outline"
      searchPlaceholder="Search places..."
      searchFilter={searchFilter}
      isLoading={isLoading}
    />
  );
});
