import ConvoScreen from '@/components/messages/ConvoScreen';
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function ConversationPage() {
  const { did } = useLocalSearchParams<{ did: string }>();
  if (!did) {
    return (
        <View><Text>Error: No conversation specified.</Text></View>
    );
  }
  return <ConvoScreen peerDid={did} />;
}
