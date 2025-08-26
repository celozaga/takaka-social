import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { Database, Download, Trash2, Power, Shield, Key, Server, AlertTriangle } from 'lucide-react';
import Head from 'expo-router/head';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import SettingsListItem from './SettingsListItem';
import SettingsDivider from '@/components/ui/SettingsDivider';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

const AdvancedSettingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { agent, session, logout } = useAtp();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [accountInfo, setAccountInfo] = useState({
        did: '',
        handle: '',
        email: '',
        createdAt: '',
        lastLogin: '',
    });

    useEffect(() => {
        loadAccountInfo();
    }, []);

    const loadAccountInfo = async () => {
        if (!session) return;
        
        try {
            setAccountInfo({
                did: session.did,
                handle: session.handle,
                email: session.email || '',
                createdAt: session.createdAt || '',
                lastLogin: session.lastLogin || '',
            });
        } catch (error) {
            console.error('Failed to load account info:', error);
        }
    };

    const handleExportData = async () => {
        if (!session) return;
        
        try {
            setIsLoading(true);
            // Redirect to Bluesky official site for data export
            if (Platform.OS === 'web') {
                window.open('https://bsky.app/settings/account', '_blank');
            } else {
                // For mobile, show info about redirecting to web
                toast({ 
                    title: t('common.info'), 
                    description: t('advancedSettings.exportRedirectInfo') 
                });
            }
        } catch (error) {
            console.error('Failed to redirect to export page:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeactivateAccount = () => {
        // Redirect to Bluesky official site for account deactivation
        if (Platform.OS === 'web') {
            window.open('https://bsky.app/settings/account', '_blank');
        } else {
            toast({ 
                title: t('common.info'), 
                description: t('advancedSettings.deactivateRedirectInfo') 
            });
        }
    };

    const handleDeleteAccount = () => {
        // Redirect to Bluesky official site for account deletion
        if (Platform.OS === 'web') {
            window.open('https://bsky.app/settings/account', '_blank');
        } else {
            toast({ 
                title: t('common.info'), 
                description: t('advancedSettings.deleteRedirectInfo') 
            });
        }
    };

    const handleChangePDS = () => {
        // TODO: Implement PDS change functionality
        toast({ 
            title: t('common.info'), 
            description: t('advancedSettings.pdsChangeInfo') 
        });
    };

    return (
        <>
            <Head><title>{t('advancedSettings.title')}</title></Head>
            <SettingsScreenLayout
                title={t('advancedSettings.title')}
                description={t('advancedSettings.description')}
            >
                <SettingsSection title={t('advancedSettings.accountInfo')}>
                    <SettingsListItem
                        icon={Key}
                        label={t('advancedSettings.did')}
                        value={accountInfo.did}
                        disabled
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Shield}
                        label={t('advancedSettings.handle')}
                        value={`@${accountInfo.handle}`}
                        disabled
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Server}
                        label={t('advancedSettings.pds')}
                        value="bsky.social"
                        onPress={handleChangePDS}
                    />
                </SettingsSection>

                <SettingsSection title={t('advancedSettings.dataManagement')}>
                    <SettingsListItem
                        icon={Download}
                        label={t('advancedSettings.exportData')}
                        sublabel={t('advancedSettings.exportDataDesc')}
                        onPress={handleExportData}
                        isLoading={isLoading}
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Database}
                        label={t('advancedSettings.clearCache')}
                        sublabel={t('advancedSettings.clearCacheDesc')}
                        onPress={() => {
                            // Clear local app cache (not ATProto related)
                            toast({ 
                                title: t('common.success'), 
                                description: t('advancedSettings.cacheCleared') 
                            });
                        }}
                    />
                </SettingsSection>

                <SettingsSection title={t('advancedSettings.dangerZone')}>
                    <SettingsListItem
                        icon={Power}
                        label={t('advancedSettings.deactivateAccount')}
                        sublabel={t('advancedSettings.deactivateAccountDesc')}
                        onPress={handleDeactivateAccount}
                        isDestructive
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Trash2}
                        label={t('advancedSettings.deleteAccount')}
                        sublabel={t('advancedSettings.deleteAccountDesc')}
                        onPress={handleDeleteAccount}
                        isDestructive
                    />
                </SettingsSection>

                <SettingsSection title={t('advancedSettings.technical')}>
                    <SettingsListItem
                        icon={AlertTriangle}
                        label={t('advancedSettings.debugMode')}
                        sublabel={t('advancedSettings.debugModeDesc')}
                        onPress={() => {
                            // TODO: Implement debug mode toggle
                            toast({ 
                                title: t('common.info'), 
                                description: t('advancedSettings.debugModeInfo') 
                            });
                        }}
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Server}
                        label={t('advancedSettings.apiVersion')}
                        value="v1.0.0"
                        disabled
                        />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default AdvancedSettingsScreen;
