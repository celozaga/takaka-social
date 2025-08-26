


import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AtSign, KeyRound, LogIn, ShieldCheck, Globe, Pencil, Check, X } from 'lucide-react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Linking, Platform, Modal } from 'react-native';
import { useTheme } from '@/components/shared';
import { PDS_URL } from '@/lib/config';
import i18n from '@/lib/i18n';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface LoginScreenProps {
  onSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [token, setToken] = useState('');
  const [loginStep, setLoginStep] = useState<'credentials' | 'token'>('credentials');
  const [emailHint, setEmailHint] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAtp();
  const { requireAuth } = useAuthGuard();
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const styles = createStyles(theme);
  
  // State for hosting provider
  const [serviceUrl, setServiceUrl] = useState<string>(PDS_URL);
  const [isProviderModalVisible, setProviderModalVisible] = useState(false);
  const [providerSelection, setProviderSelection] = useState<'bluesky' | 'custom'>('bluesky');
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Verificar se o usuário já está autenticado
  React.useEffect(() => {
    // Se já está autenticado, fechar o modal
    // requireAuth retorna true se autenticado, false se não
    if (requireAuth('login')) {
      onSuccess();
    }
  }, [requireAuth, onSuccess]);


  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await login({
        identifier,
        appPassword_DO_NOT_USE_REGULAR_PASSWORD_HERE: appPassword,
        token: loginStep === 'token' ? token : undefined,
        serviceUrl: serviceUrl
      });
      onSuccess();
    } catch (err: any) {
      if (loginStep === 'credentials' && (err.error === 'AuthFactorRequired' || Array.isArray(err.factors))) {
        const emailFactor = Array.isArray(err.factors) 
          ? err.factors.find((f: any) => f.type === 'email' && f.hint)
          : null;
        if (emailFactor) {
          setLoginStep('token');
          setEmailHint(emailFactor.hint);
          setIsLoading(false);
          return;
        }
      }
      
      setError(err.message || (loginStep === 'token' ? t('signIn.invalidToken') : t('signIn.loginFailed')));
      setIsLoading(false);
    }
  };
  
  const openAppPasswordLink = () => {
      Linking.openURL('https://bsky.app/settings/app-passwords');
  }
  
  const resetToCredentials = () => {
    setLoginStep('credentials');
    setError(null);
    setToken('');
  };

  const openProviderModal = () => {
    if (serviceUrl === PDS_URL) {
        setProviderSelection('bluesky');
        setCustomUrlInput('');
    } else {
        setProviderSelection('custom');
        setCustomUrlInput(serviceUrl.replace(/^https?:\/\//, ''));
    }
    setProviderModalVisible(true);
  };

  const handleProviderModalDone = () => {
    if (providerSelection === 'bluesky') {
        setServiceUrl(PDS_URL);
    } else {
        let finalUrl = customUrlInput.trim();
        if (!finalUrl) {
            // If custom input is cleared, revert to default Bluesky Social
            setServiceUrl(PDS_URL);
        } else {
            if (!finalUrl.startsWith('https://') && !finalUrl.startsWith('http://')) {
                finalUrl = `https://${finalUrl}`;
            }
            setServiceUrl(finalUrl);
        }
    }
    setProviderModalVisible(false);
  };

  if (loginStep === 'token') {
    return (
      <View style={styles.container}>
        <View style={styles.textCenter}>
          <Text style={styles.title}>{t('signIn.checkEmailTitle')}</Text>
          <Text style={styles.description}>{t('signIn.checkEmailDescription', { emailHint })}</Text>
        </View>
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <KeyRound style={styles.icon} color={theme.colors.onSurfaceVariant} size={20} />
            <TextInput
              value={token}
              onChangeText={setToken}
              placeholder={t('signIn.verificationCodePlaceholder')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              style={styles.input}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading || !token.trim()}
            style={({ pressed }) => [styles.button, (isLoading || pressed || !token.trim()) && styles.buttonDisabled]}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                <Text style={styles.buttonText}>{t('signIn.verifyingButton')}</Text>
              </>
            ) : (
              <>
                <ShieldCheck color={theme.colors.onPrimary} size={20} />
                <Text style={styles.buttonText}>{t('signIn.verifyButton')}</Text>
              </>
            )}
          </Pressable>
           <Pressable onPress={resetToCredentials}>
            <Text style={[styles.link, { textAlign: 'center', marginTop: 16 }]}>{t('signIn.backToLogin')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.textCenter}>
          <Text style={styles.title}>{t('signIn.title')}</Text>
          <Text style={styles.description}>{t('signIn.description')}</Text>
        </View>
        <View style={styles.formContainer}>
          <View>
            <Text style={styles.label}>{t('signIn.hostingProvider')}</Text>
            <Pressable style={styles.inputContainer} onPress={openProviderModal}>
                <Globe style={styles.icon} color={theme.colors.onSurfaceVariant} size={20} />
                <Text style={[styles.input, styles.providerInput]} numberOfLines={1}>
                    {serviceUrl === PDS_URL ? 'Bluesky Social' : serviceUrl}
                </Text>
                <Pencil style={styles.providerEditIcon} color={theme.colors.onSurfaceVariant} size={16} />
            </Pressable>
          </View>
          <View>
            <Text style={styles.label}>{t('signIn.account')}</Text>
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
                  i18n={i18n}
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
            disabled={isLoading || !identifier.trim() || !appPassword.trim()}
            style={({ pressed }) => [styles.button, (isLoading || pressed || !identifier.trim() || !appPassword.trim()) && styles.buttonDisabled]}
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
      <Modal visible={isProviderModalVisible} transparent animationType="fade" onRequestClose={() => setProviderModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setProviderModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                <Text style={styles.modalTitle}>{t('signIn.chooseProviderTitle')}</Text>
                <View style={styles.modalTabs}>
                    <Pressable style={[styles.modalTab, providerSelection === 'bluesky' && styles.modalTabActive]} onPress={() => setProviderSelection('bluesky')}>
                        <Text style={[styles.modalTabText, providerSelection === 'bluesky' && styles.modalTabTextActive]}>{t('signIn.providerBluesky')}</Text>
                    </Pressable>
                     <Pressable style={[styles.modalTab, providerSelection === 'custom' && styles.modalTabActive]} onPress={() => setProviderSelection('custom')}>
                        <Text style={[styles.modalTabText, providerSelection === 'custom' && styles.modalTabTextActive]}>{t('signIn.providerCustom')}</Text>
                    </Pressable>
                </View>
                {providerSelection === 'custom' && (
                    <View style={{marginTop: 16}}>
                        <Text style={styles.label}>{t('signIn.serverAddress')}</Text>
                         <View style={styles.inputContainer}>
                            <Globe style={styles.icon} color={theme.colors.onSurfaceVariant} size={20} />
                            <TextInput
                                value={customUrlInput}
                                onChangeText={setCustomUrlInput}
                                placeholder={t('signIn.customServerPlaceholder')}
                                placeholderTextColor={theme.colors.onSurfaceVariant}
                                style={styles.input}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoFocus
                            />
                        </View>
                    </View>
                )}
                <Text style={styles.modalDescription}>
                    <Trans
                        i18n={i18n}
                        i18nKey="signIn.providerDescription"
                        components={{
                            1: <Text style={styles.link} onPress={() => Linking.openURL('https://bsky.social/about/blog/5-23-2023-a-new-dawn-for-social')} />,
                        }}
                    />
                </Text>
                <View style={styles.modalActions}>
                     <Pressable style={[styles.modalButton, styles.modalButtonSecondary]} onPress={() => setProviderModalVisible(false)}>
                        <X color={theme.colors.onSurface} size={20} />
                        <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>{t('common.close')}</Text>
                     </Pressable>
                     <Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleProviderModalDone}>
                        <Check color={theme.colors.onPrimary} size={20} />
                        <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>{t('signIn.done')}</Text>
                     </Pressable>
                </View>
            </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
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
    fontSize: theme.typography.titleLarge.fontSize,
    color: theme.colors.primary,
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center'
  },
  formContainer: {
    gap: 24,
  },
  label: {
    fontSize: theme.typography.labelMedium.fontSize,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
    paddingLeft: 4
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
  providerInput: {
    paddingRight: 40,
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 20
  },
  providerEditIcon: {
    position: 'absolute',
    right: 16,
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
    borderRadius: theme.radius.full,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 16
  },
  // Modal Styles
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.titleLarge.fontSize,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 8,
    padding: 2,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalTabActive: {
    backgroundColor: theme.colors.primary,
  },
  modalTabText: {
    fontSize: theme.typography.bodyMedium.fontSize,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalTabTextActive: {
    color: theme.colors.onPrimary,
  },
  modalDescription: {
    fontSize: theme.typography.bodyMedium.fontSize,
    color: theme.colors.onSurfaceVariant,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
  },
  modalButtonSecondary: {
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: theme.typography.labelLarge.fontSize,
    fontWeight: 'bold',
  },
  modalButtonTextSecondary: {
    color: theme.colors.onSurface,
  },
  modalButtonTextPrimary: {
    color: theme.colors.onPrimary,
  },
});

export default LoginScreen;