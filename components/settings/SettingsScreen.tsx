import React from 'react';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { Bell, UserCircle, LogOut, Globe, Shield } from 'lucide-react';
import ScreenHeader from '../layout/ScreenHeader';
import { useUI } from '../../context/UIContext';
import { supportedLanguages } from '../../lib/i18n';
import Head from 'expo-router/head';
import { View, Alert, Platform } from 'react-native';
import { theme } from '@/lib/theme';
import SettingsListItem from './SettingsListItem';
import SettingsDivider from '@/components/ui/SettingsDivider';

const SettingsScreen: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { logout } = useAtp();
    const { setCustomFeedHeaderVisible } = useUI();
    const router = useRouter();

    React.useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const handleLogout = () => {
        const confirmLogout = () => {
            logout();
            router.replace('/home');
        };

        if (Platform.OS === 'web') {
            if (window.confirm(t('settings.signOutConfirm'))) {
                confirmLogout();
            }
        } else {
            Alert.alert(
                t('settings.signOut'),
                t('settings.signOutConfirm'),
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: confirmLogout }
                ],
                { cancelable: true }
            );
        }
    }

    const currentLanguageName = supportedLanguages.find(l => i18n.language.startsWith(l.code))?.name || 'English';

    return (
        <>
            <Head><title>{t('settings.title')}</title></Head>
            <View>
                <ScreenHeader title={t('settings.title')} />
                <View style={theme.settingsStyles.scrollContainer}>
                    <View style={theme.settingsStyles.section}>
                        <SettingsListItem icon={Shield} label="Moderation" href="/settings/moderation" />
                        <SettingsDivider />
                        <SettingsListItem icon={Globe} label={t('settings.language')} value={currentLanguageName} href="/settings/language" />
                        <SettingsDivider />
                        <SettingsListItem icon={Bell} label={t('settings.notifications')} href="/settings/notifications" />
                        <SettingsDivider />
                        <SettingsListItem icon={UserCircle} label={t('settings.account')} href="/settings/account" />
                    </View>

                    <View style={[{marginTop: theme.spacing.xxl}, theme.settingsStyles.section]}>
                        <SettingsListItem 
                            icon={LogOut} 
                            label={t('settings.signOut')} 
                            onPress={handleLogout}
                            isDestructive
                        />
                    </View>
                </View>
            </View>
        </>
    );
};

export default SettingsScreen;