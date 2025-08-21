import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUI } from '../../context/UIContext';
import { LogIn } from 'lucide-react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
          <LogIn size={16} color="#003258" />
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
    backgroundColor: '#D1E4FF', // primary-container
    color: '#001D35', // on-primary-container
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
    color: '#001D35',
  },
  description: {
    fontSize: 12,
    color: '#001D35',
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#A8C7FA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    flexShrink: 0,
  },
  buttonText: {
    color: '#003258',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LoginPrompt;