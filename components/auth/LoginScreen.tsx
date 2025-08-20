import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AtSign, KeyRound, LogIn } from 'lucide-react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';

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
          <AtSign style={styles.icon} color="#8A9199" size={20} />
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={t('signIn.handlePlaceholder')}
            placeholderTextColor="#8A9199"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.inputContainer}>
          <KeyRound style={styles.icon} color="#8A9199" size={20} />
          <TextInput
            value={appPassword}
            onChangeText={setAppPassword}
            placeholder={t('signIn.appPasswordPlaceholder')}
            placeholderTextColor="#8A9199"
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
              <ActivityIndicator size="small" color="#003258" />
              <Text style={styles.buttonText}>{t('signIn.buttonLoading')}</Text>
            </>
          ) : (
            <>
              <LogIn color="#003258" size={20} />
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
    backgroundColor: '#1E2021',
    borderRadius: 16,
    padding: 32,
  },
  textCenter: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#A8C7FA',
  },
  description: {
    color: '#C3C6CF',
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
    backgroundColor: '#2b2d2e',
    borderRadius: 8,
    color: '#E2E2E6',
    fontSize: 16,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      }
    }) as any,
  },
  noticeText: {
    fontSize: 12,
    color: '#C3C6CF',
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 16
  },
  link: {
    color: '#A8C7FA',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#F2B8B5',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#A8C7FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#003258',
    fontWeight: 'bold',
    fontSize: 16
  },
});

export default LoginScreen;