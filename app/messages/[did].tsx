import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenHeader from '@/components/layout/ScreenHeader';
import { useLocalSearchParams } from 'expo-router';
import { MessageSquareText } from 'lucide-react';


export default function ConversationScreen() {
  const { did } = useLocalSearchParams<{ did: string }>();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Conversation" />
      <View style={styles.content}>
        <MessageSquareText size={48} color="#8A9199" />
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          Direct messaging with {did} is under construction.
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#E2E2E6',
      marginTop: 16,
    },
    subtitle: {
      fontSize: 16,
      color: '#C3C6CF',
      marginTop: 8,
      textAlign: 'center',
    },
  });