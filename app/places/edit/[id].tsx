import { useLocalSearchParams } from 'expo-router';
import { PlaceFormPage } from '../../../src/features/places/screens/PlaceFormPage';

export default function PlaceEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlaceFormPage mode="edit" placeId={parseInt(id, 10)} />;
}
