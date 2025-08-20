
import React from 'react';
import { ComAtprotoLabelDefs } from '@atproto/api';
import { ShieldAlert } from 'lucide-react';
import { View, Text, StyleSheet } from 'react-native';

const Label: React.FC<{ label: ComAtprotoLabelDefs.Label }> = ({ label }) => {
  return (
    <View style={styles.container}>
      <ShieldAlert size={14} color="#C3C6CF" />
      <Text style={styles.text}>{label.val}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#2b2d2e', // surface-3
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
        color: '#C3C6CF', // on-surface-variant
    }
})

export default Label;
