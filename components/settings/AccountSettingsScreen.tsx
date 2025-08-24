import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useToast } from '../ui/use-toast';
import ScreenHeader from '../layout/ScreenHeader';
import { Mail, Edit, Lock, AtSign, Cake, Download, Power, Trash2, ShieldCheck } from 'lucide-react';
import { Head } from 'expo-router/head';
import { View, Text, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';
import SettingsListItem from './SettingsListItem';
import SettingsDivider from '@/components/ui/SettingsDivider';

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
            <View style={{flex: 1}}>
                <ScreenHeader title={t('accountSettings.title')} />
                <ScrollView contentContainerStyle={theme.settingsStyles.container}>
                    <View style={theme.settingsStyles.section}>
                        <SettingsListItem icon={Mail} label={t('accountSettings.email')} value={emailValue} />
                        <SettingsDivider />
                        <SettingsListItem icon={Edit} label={t('accountSettings.updateEmail')} onPress={openUpdateEmailModal} disabled={!!actionInProgress} />
                        <SettingsDivider />
                        <SettingsListItem icon={Lock} label={t('accountSettings.password')} href="https://bsky.app/settings/password" />
                        <SettingsDivider />
                        <SettingsListItem icon={AtSign} label={t('accountSettings.handle')} value={`@${session?.handle}`} onPress={openUpdateHandleModal} disabled={!!actionInProgress} />
                        <SettingsDivider />
                        <SettingsListItem icon={Cake} label={t('accountSettings.birthday')} href="https://bsky.app/settings/birthday" />
                    </View>
                    <View style={theme.settingsStyles.section}>
                        <SettingsListItem icon={Download} label={t('accountSettings.exportData')} onPress={handleExportData} isLoading={actionInProgress === 'export'} disabled={!!actionInProgress} />
                        <SettingsDivider />
                        <SettingsListItem icon={Power} label={t('accountSettings.deactivateAccount')} onPress={handleDeactivate} isDestructive isLoading={actionInProgress === 'deactivate'} disabled={!!actionInProgress} />
                        <SettingsDivider />
                        <SettingsListItem icon={Trash2} label={t('accountSettings.deleteAccount')} onPress={handleDeleteAccount} isDestructive isLoading={actionInProgress === 'delete'} disabled={!!actionInProgress} />
                    </View>
                </ScrollView>
            </View>
        </>
    );
};

export default AccountSettingsScreen;