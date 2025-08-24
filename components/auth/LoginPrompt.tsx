import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUI } from '../../context/UIContext';
import { LogIn } from 'lucide-react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';

const LoginPrompt: React.FC = () => {
  const { openLoginModal } = useUI();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const bottomPosition = Platform.select({
    web: 16,
    default: 80 + insets.bottom,
  });

  return (
    <View style={[styles.container, { bottom: bottomPosition }]}>
      <View style={styles.promptBox}>
        <View>
            <Text style={styles.title}>{t('loginPrompt.title')}</Text>
            <Text style={styles.description}>{t('loginPrompt.description')}</Text>
        </View>
        <Pressable 
            onPress={openLoginModal}
            style={styles.button}
        >
          <LogIn size={16} color={theme.colors.onPrimary} />
          <Text style={styles.buttonText}>{t('nav.signIn')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 50,
  },
  promptBox: {
    backgroundColor: theme.colors.surfaceContainer,
    color: theme.colors.onSurface,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
    maxWidth: 512,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      },
      default: {
        elevation: 5,
      }
    }),
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  description: {
    fontSize: 12,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  button: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.shape.full,
    flexShrink: 0,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LoginPrompt;