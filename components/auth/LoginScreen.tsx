import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AtSign, KeyRound, LogIn } from 'lucide-react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import { theme } from '@/lib/theme';

interface LoginScreenProps {
  onSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAtp();
  const { t } = useTranslation();

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await login(identifier, appPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('signIn.loginFailed'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openAppPasswordLink = () => {
      Linking.openURL('https://bsky.app/settings/app-passwords');
  }

  return (
    <View style={styles.container}>
      <View style={styles.textCenter}>
        <Text style={styles.title}>{t('signIn.title')}</Text>
        <Text style={styles.description}>{t('signIn.description')}</Text>
      </View>
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <AtSign style={styles.icon} color={theme.colors.onSurfaceVariant} size={20} />
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={t('signIn.handlePlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.inputContainer}>
          <KeyRound style={styles.icon} color={theme.colors.onSurfaceVariant} size={20} />
          <TextInput
            value={appPassword}
            onChangeText={setAppPassword}
            placeholder={t('signIn.appPasswordPlaceholder')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={styles.input}
            secureTextEntry
          />
        </View>
        <Text style={styles.noticeText}>
            <Trans
                i18nKey="signIn.appPasswordNotice"
                components={{
                    1: <Text style={styles.link} onPress={openAppPasswordLink} />,
                    strong: <Text style={{fontWeight: 'bold'}}/>
                }}
            />
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Pressable
          onPress={handleLogin}
          disabled={isLoading}
          style={({ pressed }) => [styles.button, (isLoading || pressed) && styles.buttonDisabled]}
        >
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              <Text style={styles.buttonText}>{t('signIn.buttonLoading')}</Text>
            </>
          ) : (
            <>
              <LogIn color={theme.colors.onPrimary} size={20} />
              <Text style={styles.buttonText}>{t('signIn.button')}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 448,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 16,
    padding: 32,
  },
  textCenter: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.primary,
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  formContainer: {
    gap: 24,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  icon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    width: '100%',
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 8,
    color: theme.colors.onSurface,
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      }
    }) as any,
  },
  noticeText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 16
  },
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.shape.full,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 16
  },
});

export default LoginScreen;
