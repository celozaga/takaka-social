
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '@/lib/theme';
import { PrimaryButton } from '@/components/shared';

interface LoginPromptProps {
  onPress: () => void;
  style?: any;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ onPress, style }) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{t('nav.signInRequired')}</Text>
      <Text style={styles.description}>{t('nav.signInDescription')}</Text>
      <PrimaryButton
        title={t('nav.signIn')}
        onPress={onPress}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.l,
    gap: theme.spacing.m,
  },
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  description: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: theme.spacing.m,
  },
});

export default LoginPrompt;