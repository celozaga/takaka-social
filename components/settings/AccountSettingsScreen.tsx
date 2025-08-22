import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useToast } from '../ui/use-toast';
import ScreenHeader from '../layout/ScreenHeader';
import { Mail, Edit, Lock, AtSign, Cake, Download, Power, Trash2, ChevronRight, ShieldCheck, Loader2 } from 'lucide-react';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';

interface SettingsListItemProps {
    icon: React.ElementType;
    label: string;
    value?: React.ReactNode;
    href?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    isLoading?: boolean;
    disabled?: boolean;
}

const SettingsListItem: React.FC<SettingsListItemProps> = ({ icon: Icon, label, value, href, onPress, isDestructive = false, isLoading = false, disabled = false }) => {
    const handlePress = () => {
        if (disabled) return;
        if (onPress) onPress();
        else if (href) Linking.openURL(href);
    };

    return (
        <Pressable onPress={handlePress} disabled={disabled} style={({ pressed }) => [styles.listItem, disabled && styles.disabled, pressed && !disabled && styles.listItemPressed]}>
            <View style={styles.listItemContent}>
                <Icon style={styles.icon} color={isDestructive ? theme.colors.error : theme.colors.onSurfaceVariant} size={24} />
                <Text style={[styles.label, isDestructive && styles.destructiveText]}>{label}</Text>
            </View>
            <View style={styles.listItemContent}>
                {value && <Text style={styles.valueText}>{value}</Text>}
                {isLoading ? (
                    <Loader2 color={theme.colors.onSurfaceVariant} size={20} style={{ animation: 'spin 1s linear infinite' } as any} />
                ) : (
                    (href || onPress) && <ChevronRight color={theme.colors.onSurfaceVariant} size={20} />
                )}
            </View>
        </Pressable>
    );
};

const AccountSettingsScreen: React.FC = () => {
    const { session, agent, logout } = useAtp();
    const { setCustomFeedHeaderVisible, openUpdateEmailModal, openUpdateHandleModal } = useUI();
    const { toast } = useToast();
    const { t } = useTranslation();
    const router = useRouter();
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    React.useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const handleAction = (title: string, message: string, actionFn: () => Promise<void>) => {
        const performAction = async () => {
            try {
                await actionFn();
            } catch (e) {
                console.error(`Action '${title}' failed`, e);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(message)) {
                performAction();
            }
        } else {
            Alert.alert(title, message, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', style: 'destructive', onPress: performAction },
            ]);
        }
    };
    
    const handleExportData = async () => {
        if (actionInProgress) return;
        setActionInProgress('export');
        toast({ title: t('accountSettings.toast.exportRequest'), description: t('accountSettings.toast.exportRequestDescription') });
        try {
            await (agent.com.atproto.server as any).requestAccountExport();
            toast({ title: t('accountSettings.toast.exportStarted'), description: t('accountSettings.toast.exportStartedDescription') });
        } catch (e) {
            console.error("Failed to request data export", e);
            toast({ title: "Error", description: t('accountSettings.toast.exportError'), variant: "destructive" });
        } finally {
            setActionInProgress(null);
        }
    };
    
    const handleDeactivate = () => handleAction(
        'Deactivate Account',
        t('accountSettings.confirmations.deactivate'),
        async () => {
            setActionInProgress('deactivate');
            await agent.com.atproto.server.deactivateAccount({});
            toast({ title: t('accountSettings.toast.deactivated'), description: t('accountSettings.toast.deactivatedDescription') });
            await logout();
            router.replace('/');
            setActionInProgress(null);
        }
    );

    const handleDeleteAccount = () => handleAction(
        'Delete Account',
        t('accountSettings.confirmations.delete'),
        async () => {
            setActionInProgress('delete');
            toast({ title: t('accountSettings.toast.deleteRequest') });
            await agent.com.atproto.server.requestAccountDelete();
            toast({ title: t('accountSettings.toast.deleteRequested'), description: t('accountSettings.toast.deleteRequestedDescription') });
            setActionInProgress(null);
        }
    );
    
    const emailValue = (
        <View style={styles.emailValueContainer}>
            <Text style={styles.valueText}>{session?.email}</Text>
            {session?.emailConfirmed && <ShieldCheck color={theme.colors.onSurface} size={16} />}
        </View>
    );

    return (
        <>
            <Head><title>{t('accountSettings.title')}</title></Head>
            <View style={styles.container}>
                <ScreenHeader title={t('accountSettings.title')} />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <SettingsListItem icon={Mail} label={t('accountSettings.email')} value={emailValue} />
                        <SettingsListItem icon={Edit} label={t('accountSettings.updateEmail')} onPress={openUpdateEmailModal} disabled={!!actionInProgress} />
                        <SettingsListItem icon={Lock} label={t('accountSettings.password')} href="https://bsky.app/settings/password" />
                        <SettingsListItem icon={AtSign} label={t('accountSettings.handle')} value={`@${session?.handle}`} onPress={openUpdateHandleModal} disabled={!!actionInProgress} />
                        <SettingsListItem icon={Cake} label={t('accountSettings.birthday')} href="https://bsky.app/settings/birthday" />
                    </View>
                    <View style={styles.section}>
                        <SettingsListItem icon={Download} label={t('accountSettings.exportData')} onPress={handleExportData} isLoading={actionInProgress === 'export'} disabled={!!actionInProgress} />
                        <SettingsListItem icon={Power} label={t('accountSettings.deactivateAccount')} onPress={handleDeactivate} isDestructive isLoading={actionInProgress === 'deactivate'} disabled={!!actionInProgress} />
                        <SettingsListItem icon={Trash2} label={t('accountSettings.deleteAccount')} onPress={handleDeleteAccount} isDestructive isLoading={actionInProgress === 'delete'} disabled={!!actionInProgress} />
                    </View>
                </ScrollView>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 24,
    },
    section: {
        borderWidth: 1,
        borderColor: theme.colors.outline,
        borderRadius: 12,
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
    },
    listItemPressed: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    disabled: {
        opacity: 0.5,
    },
    listItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    icon: {
        width: 24,
        height: 24,
    },
    label: {
        fontWeight: '600',
        color: theme.colors.onSurface,
        fontSize: 16,
    },
    destructiveText: {
        color: theme.colors.error,
    },
    valueText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
        marginRight: 8,
    },
    emailValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
});

export default AccountSettingsScreen;