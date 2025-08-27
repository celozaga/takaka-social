import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

interface ContentWarningProps {
  reason: string;
  onShow: () => void;
}

const ContentWarning: React.FC<ContentWarningProps> = ({ reason, onShow }) => {
  return (
    <View style={styles.container}>
      <ShieldAlert color={theme.colors.onSurfaceVariant} size={40} style={{ marginBottom: theme.spacing.m }} />
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
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.large,
        padding: theme.spacing.l,
        alignItems: 'center',
    },
    title: {
        ...theme.typography.labelLarge,
        color: theme.colors.onSurface,
    },
    reasonText: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurfaceVariant,
        marginBottom: theme.spacing.l,
        textTransform: 'capitalize',
    },
    showButton: {
        backgroundColor: theme.colors.surfaceContainerHigh,
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.shape.full,
    },
    showButtonText: {
        ...theme.typography.labelLarge,
        color: theme.colors.onSurface,
        fontWeight: 'bold',
    }
});

export default ContentWarning;
