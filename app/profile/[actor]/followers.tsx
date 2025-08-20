import FollowsScreen from '@/components/profile/FollowsScreen';
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function FollowersPage() {
  const { actor } = useLocalSearchParams<{ actor: string }>();
  if (!actor) {
    return <View><Text>Error: No actor specified.</Text></View>
  }
  return <FollowsScreen actor={actor} type="followers" />;
}
