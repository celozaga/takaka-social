
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, PrimaryButton, Typography } from '@/components/shared';
import { useUI } from '@/context/UIContext';

interface LoginPromptProps {
  style?: any;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ style }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { openLoginModal } = useUI();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    button: {
      marginTop: theme.spacing.md,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Typography variant="titleLarge" color="onSurface" align="center">
        {t('nav.signInRequired')}
      </Typography>
      
      <Typography variant="bodyMedium" color="onSurfaceVariant" align="center">
        {t('nav.signInDescription')}
      </Typography>
      
      <PrimaryButton
        title={t('nav.signIn')}
        onPress={openLoginModal}
        style={styles.button}
      />
    </View>
  );
};

export default LoginPrompt;