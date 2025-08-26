import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenHeader from '@/components/layout/ScreenHeader';
import { MessageSquareText } from 'lucide-react';
import RouteGuard from '@/components/auth/RouteGuard';

export default function MessagesScreen() {
  return (
    <RouteGuard requireAuth={true} redirectTo="/home">
      <View style={styles.container}>
        <ScreenHeader title="Messages" />
        <View style={styles.content}>
          <MessageSquareText size={48} color="#8A9199" />
          <Text style={styles.title}>Coming Soon</Text>
          <Text style={styles.subtitle}>Direct messaging is under construction.</Text>
        </View>
      </View>
    </RouteGuard>
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