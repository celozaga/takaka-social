import ModerationServiceScreen from '@/components/settings/ModerationServiceScreen';
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function ModServicePage() {
  const { did } = useLocalSearchParams<{ did: string }>();
   if (!did) {
    return <View><Text>Error: No service specified.</Text></View>
  }
  return <ModerationServiceScreen serviceDid={did} />;
}
