import React from 'react';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { Bell, UserCircle, LogOut, Globe, Shield, Lock, Rss, Eye, Database, ChevronRight } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { supportedLanguages } from '../../lib/i18n';
import Head from 'expo-router/head';
import { Alert, Platform } from 'react-native';
import { theme } from '@/lib/theme';
import SettingsListItem from './SettingsListItem';
import { SettingsDivider } from '@/components/shared';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

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
            <SettingsScreenLayout title={t('settings.title')}>
                <SettingsSection>
                    <SettingsListItem icon={Shield} label={t('settings.moderation.title')} href="/settings/moderation" />
                    <SettingsDivider />
                    <SettingsListItem icon={Globe} label={t('settings.language')} value={currentLanguageName} href="/settings/language" />
                    <SettingsDivider />
                    <SettingsListItem icon={Bell} label={t('settings.notifications')} href="/settings/notifications" />
                    <SettingsDivider />
                    <SettingsListItem icon={UserCircle} label={t('settings.account')} href="/settings/account" />
                </SettingsSection>

                <SettingsSection>
                    <SettingsListItem icon={Lock} label={t('settings.privacy')} href="/settings/privacy" />
                    <SettingsDivider />
                    <SettingsListItem icon={Rss} label={t('settings.feeds')} href="/settings/feeds" />
                    <SettingsDivider />
                    <SettingsListItem icon={Eye} label={t('settings.accessibility')} href="/settings/accessibility" />
                    <SettingsDivider />
                    <SettingsListItem icon={Database} label={t('settings.advanced')} href="/settings/advanced" />
                </SettingsSection>

                <SettingsSection>
                    <SettingsListItem 
                        icon={LogOut} 
                        label={t('settings.signOut')} 
                        onPress={handleLogout}
                        isDestructive
                    />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default SettingsScreen;