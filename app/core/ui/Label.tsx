import React from 'react';
import { ComAtprotoLabelDefs } from '@atproto/api';
import { ShieldAlert } from 'lucide-react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';

const Label: React.FC<{ label: ComAtprotoLabelDefs.Label }> = ({ label }) => {
  return (
    <View style={styles.container}>
      <ShieldAlert size={14} color={theme.colors.onSurfaceVariant} />
      <Text style={styles.text}>{label.val}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.surfaceContainerHigh,
        paddingHorizontal: theme.spacing.s,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.shape.small,
    },
    text: {
        ...theme.typography.labelMedium,
        color: theme.colors.onSurfaceVariant,
        fontWeight: '600',
    }
})

export default Label;
