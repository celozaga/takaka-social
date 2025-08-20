import FeedViewScreen from '@/components/feeds/FeedViewScreen';
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function FeedViewPage() {
  const { handle, rkey } = useLocalSearchParams<{ handle: string; rkey: string }>();
  if (!handle || !rkey) {
      return <View><Text>Error: Invalid feed identifier.</Text></View>;
  }
  return <FeedViewScreen handle={handle} rkey={rkey} />;
}
