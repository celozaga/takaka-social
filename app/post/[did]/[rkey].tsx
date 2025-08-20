import PostScreen from '@/components/post/PostScreen';
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';


export default function PostPage() {
  const { did, rkey } = useLocalSearchParams<{ did: string; rkey: string }>();
  if (!did || !rkey) {
      return <View><Text>Error: Invalid post identifier.</Text></View>;
  }
  return <PostScreen did={did} rkey={rkey} />;
}
