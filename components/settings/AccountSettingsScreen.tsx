import React, { useState } from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useToast } from '@/components/shared';
import { Mail, Edit, Lock, AtSign, Cake, Download, Power, Trash2, ShieldCheck } from 'lucide-react';
import Head from 'expo-router/head';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';

import SettingsListItem from './SettingsListItem';
import { SettingsDivider } from '@/components/shared';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';
import { useDebouncedAction } from '@/hooks/useDebounce';

const AccountSettingsScreen: React.FC = () => {
    const { session, agent, logout } = useAtp();
    const { openUpdateEmailModal, openUpdateHandleModal } = useUI();
    const { toast } = useToast();
    const { t } = useTranslation();
    const router = useRouter();
    const { theme } = useTheme();
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    const exportDataAction = async () => {
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

    const deactivateAction = async () => {
        setActionInProgress('deactivate');
        await agent.com.atproto.server.deactivateAccount({});
        toast({ title: t('accountSettings.toast.deactivated'), description: t('accountSettings.toast.deactivatedDescription') });
        await logout();
        router.replace('/');
        setActionInProgress(null);
    };

    const deleteAccountAction = async () => {
        setActionInProgress('delete');
        toast({ title: t('accountSettings.toast.deleteRequest') });
        await agent.com.atproto.server.requestAccountDelete();
        toast({ title: t('accountSettings.toast.deleteRequested'), description: t('accountSettings.toast.deleteRequestedDescription') });
        setActionInProgress(null);
    };

    const { execute: executeExport, isLoading: isExportPending } = useDebouncedAction(exportDataAction, 1000);

    const { execute: executeDeactivate, isLoading: isDeactivatePending } = useDebouncedAction(deactivateAction, 1000);

    const { execute: executeDelete, isLoading: isDeletePending } = useDebouncedAction(deleteAccountAction, 1000);

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
    
    const handleExportData = () => {
        executeExport();
    };
    
    const handleDeactivate = () => handleAction(
        'Deactivate Account',
        t('accountSettings.confirmations.deactivate'),
        executeDeactivate
    );

    const handleDeleteAccount = () => handleAction(
        'Delete Account',
        t('accountSettings.confirmations.delete'),
        executeDelete
    );
    
    const emailValue = (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text style={theme.settingsStyles.value}>{session?.email}</Text>
            {session?.emailConfirmed && <ShieldCheck color={theme.colors.onSurface} size={16} />}
        </View>
    );

    return (
        <>
            <Head><title>{t('accountSettings.title')}</title></Head>
            <SettingsScreenLayout title={t('accountSettings.title')}>
                <SettingsSection>
                    <SettingsListItem icon={Mail} label={t('accountSettings.email')} value={emailValue} />
                    <SettingsDivider />
                    <SettingsListItem icon={Edit} label={t('accountSettings.updateEmail')} onPress={openUpdateEmailModal} disabled={!!actionInProgress} />
                    <SettingsDivider />
                    <SettingsListItem icon={Lock} label={t('accountSettings.password')} onPress={() => {
                        if (Platform.OS === 'web') {
                            window.open('https://bsky.app/settings/password', '_blank');
                        } else {
                            toast({ 
                                title: t('common.info'), 
                                description: t('accountSettings.passwordRedirectInfo') 
                            });
                        }
                    }} />
                    <SettingsDivider />
                    <SettingsListItem icon={AtSign} label={t('accountSettings.handle')} value={`@${session?.handle}`} onPress={openUpdateHandleModal} disabled={!!actionInProgress} />
                    <SettingsDivider />
                    <SettingsListItem icon={Cake} label={t('accountSettings.birthday')} onPress={() => {
                        if (Platform.OS === 'web') {
                            window.open('https://bsky.app/settings/birthday', '_blank');
                        } else {
                            toast({ 
                                title: t('common.info'), 
                                description: t('accountSettings.birthdayRedirectInfo') 
                            });
                        }
                    }} />
                </SettingsSection>
                
                <SettingsSection title={t('accountSettings.accountActions')}>
                    <SettingsListItem icon={Download} label={t('accountSettings.exportData')} onPress={handleExportData} isLoading={isExportPending || actionInProgress === 'export'} disabled={!!actionInProgress || isExportPending} />
                    <SettingsDivider />
                    <SettingsListItem icon={Power} label={t('accountSettings.deactivateAccount')} onPress={handleDeactivate} isDestructive isLoading={isDeactivatePending || actionInProgress === 'deactivate'} disabled={!!actionInProgress || isDeactivatePending} />
                    <SettingsDivider />
                    <SettingsListItem icon={Trash2} label={t('accountSettings.deleteAccount')} onPress={handleDeleteAccount} isDestructive isLoading={isDeletePending || actionInProgress === 'delete'} disabled={!!actionInProgress || isDeletePending} />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default AccountSettingsScreen;