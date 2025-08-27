import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useToast } from '@/components/shared';
import { Mail, Edit, Lock, AtSign, Cake, Download, Power, Trash2, ShieldCheck } from 'lucide-react';
import Head from 'expo-router/head';
import { View, Text, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';
import SettingsListItem from './SettingsListItem';
import { SettingsDivider } from '@/components/shared';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

const AccountSettingsScreen: React.FC = () => {
    const { session, agent, logout } = useAtp();
    const { openUpdateEmailModal, openUpdateHandleModal } = useUI();
    const { toast } = useToast();
    const { t } = useTranslation();
    const router = useRouter();
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

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
                    <SettingsListItem icon={Download} label={t('accountSettings.exportData')} onPress={handleExportData} isLoading={actionInProgress === 'export'} disabled={!!actionInProgress} />
                    <SettingsDivider />
                    <SettingsListItem icon={Power} label={t('accountSettings.deactivateAccount')} onPress={handleDeactivate} isDestructive isLoading={actionInProgress === 'deactivate'} disabled={!!actionInProgress} />
                    <SettingsDivider />
                    <SettingsListItem icon={Trash2} label={t('accountSettings.deleteAccount')} onPress={handleDeleteAccount} isDestructive isLoading={actionInProgress === 'delete'} disabled={!!actionInProgress} />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default AccountSettingsScreen;