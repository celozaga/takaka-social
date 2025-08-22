import React from 'react';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { Bell, UserCircle, LogOut, Globe, Shield, ChevronRight } from 'lucide-react';
import ScreenHeader from '../layout/ScreenHeader';
import { useUI } from '../../context/UIContext';
import { supportedLanguages } from '../../lib/i18n';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { theme } from '@/lib/theme';

const SettingsListItem: React.FC<{
    icon: React.ElementType;
    label: string;
    value?: string;
    href: string;
    isLast?: boolean;
}> = ({ icon: Icon, label, value, href, isLast = false }) => (
    <Link href={href as any} asChild>
        <Pressable style={({ pressed }) => [styles.listItem, isLast && styles.lastListItem, pressed && styles.listItemPressed]}>
            <View style={styles.listItemContent}>
                <View style={styles.listItemLeft}>
                    <Icon size={24} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.listItemLabel}>{label}</Text>
                </View>
                <View style={styles.listItemRight}>
                    {value && <Text style={styles.listItemValue}>{value}</Text>}
                    <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />
                </View>
            </View>
        </Pressable>
    </Link>
);

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
            router.replace('/(tabs)/home');
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
            <View style={styles.container}>
                <ScreenHeader title={t('settings.title')} />
                <View style={styles.contentContainer}>
                    <SettingsListItem icon={Shield} label="Moderation" href="/settings/moderation" />
                    <SettingsListItem icon={Globe} label={t('settings.language')} value={currentLanguageName} href="/settings/language" />
                    <SettingsListItem icon={Bell} label={t('settings.notifications')} href="/settings/notifications" />
                    <SettingsListItem icon={UserCircle} label={t('settings.account')} href="/settings/account" isLast />

                    <Pressable onPress={handleLogout} style={({ pressed }) => [styles.listItem, styles.logoutButton, pressed && styles.listItemPressed]}>
                        <View style={styles.listItemContent}>
                            <View style={styles.listItemLeft}>
                                <LogOut size={24} color={theme.colors.error} />
                                <Text style={[styles.listItemLabel, styles.destructiveText]}>{t('settings.signOut')}</Text>
                            </View>
                        </View>
                    </Pressable>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        marginTop: 16,
        marginHorizontal: 16,
    },
    listItem: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
    },
    lastListItem: {
        borderBottomWidth: 0,
    },
    listItemPressed: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    listItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    listItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    listItemLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.onSurface,
    },
    listItemValue: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
    },
    logoutButton: {
        marginTop: 32,
        borderBottomWidth: 0,
    },
    destructiveText: {
        color: theme.colors.error,
    }
});

export default SettingsScreen;