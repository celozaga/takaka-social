import SearchScreen from '@/components/search/SearchScreen';
import { useLocalSearchParams } from 'expo-router';
import RouteGuard from '@/components/auth/RouteGuard';

export default function SearchPage() {
  const { q, filter } = useLocalSearchParams<{ q: string; filter: string }>();
  return (
    <RouteGuard requireAuth={true} redirectTo="/home">
      <SearchScreen initialQuery={q} initialFilter={filter} />
    </RouteGuard>
  );
}