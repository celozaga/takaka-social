import SearchScreen from '@/components/search/SearchScreen';
import { useLocalSearchParams } from 'expo-router';

export default function SearchPage() {
  const { q, filter } = useLocalSearchParams<{ q: string; filter: string }>();
  return <SearchScreen initialQuery={q} initialFilter={filter} />;
}
