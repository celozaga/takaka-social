import ProfileScreen from '@/components/profile/ProfileScreen';
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function ProfilePage() {
  const { actor } = useLocalSearchParams<{ actor: string }>();
  if (!actor) {
    return <View><Text>Error: No actor specified.</Text></View>
  }
  return <ProfileScreen actor={actor} />;
}
