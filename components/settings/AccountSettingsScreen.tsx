
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
                <Icon style={styles.icon} color={isDestructive ? '#F2B8B5' : '#C3C6CF'} size={24} />
                <Text style={[styles.label, isDestructive && styles.destructiveText]}>{label}</Text>
            </View>
            <View style={styles.listItemContent}>
                {value && <Text style={styles.valueText}>{value}</Text>}
                {isLoading ? (
                    <Loader2 color="#C3C6CF" size={20} style={{ animation: 'spin 1s linear infinite' } as any} />
                ) : (
                    (href || onPress) && <ChevronRight color="#C3C6CF" size={20} />
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
            {session?.emailConfirmed && <ShieldCheck color="#A8C7FA" size={16} />}
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
        backgroundColor: '#1E2021', // surface-2
        borderRadius: 12,
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1E2021',
    },
    listItemPressed: {
        backgroundColor: '#2b2d2e',
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
        color: '#E2E2E6',
        fontSize: 16,
    },
    destructiveText: {
        color: '#F2B8B5',
    },
    valueText: {
        color: '#C3C6CF',
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
