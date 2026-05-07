import { AccountFormPage } from '../../../src/features/accounts/screens/AccountFormPage';
import { useLocalSearchParams } from 'expo-router';

export default function AccountEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AccountFormPage mode="edit" accountId={Number(id)} />;
}
