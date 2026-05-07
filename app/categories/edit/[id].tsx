import { CategoryFormPage } from '../../../src/features/categories/screens/CategoryFormPage';
import { useLocalSearchParams } from 'expo-router';

export default function CategoryEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CategoryFormPage mode="edit" categoryId={Number(id)} />;
}
