
import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface ContentWarningProps {
  reason: string;
  onShow: () => void;
}

const ContentWarning: React.FC<ContentWarningProps> = ({ reason, onShow }) => {
  return (
    <View style={styles.container}>
      <ShieldAlert color="#C3C6CF" size={40} style={{ marginBottom: 12 }} />
      <Text style={styles.title}>Content Warning</Text>
      <Text style={styles.reasonText}>{reason}</Text>
      <Pressable
        onPress={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onShow();
        }}
        style={styles.showButton}
      >
        <Text style={styles.showButtonText}>Show</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1E2021', // surface-2
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    title: {
        fontWeight: '600',
        color: '#E2E2E6', // on-surface
    },
    reasonText: {
        fontSize: 14,
        color: '#C3C6CF', // on-surface-variant
        marginBottom: 16,
        textTransform: 'capitalize',
    },
    showButton: {
        backgroundColor: '#2b2d2e', // surface-3
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 999,
    },
    showButtonText: {
        color: '#E2E2E6',
        fontWeight: 'bold',
    }
});

export default ContentWarning;
