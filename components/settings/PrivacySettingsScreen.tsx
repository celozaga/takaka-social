import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '@/components/shared';
import { Lock, Eye, EyeOff, Shield, Users, UserCheck, Globe } from 'lucide-react';
import Head from 'expo-router/head';
import SettingsListItem from './SettingsListItem';
import { SettingsDivider, Switch } from '@/components/shared';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';
import { useDebouncedAction } from '../../hooks/useDebounce';

const PrivacySettingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const [settings, setSettings] = useState({
        // These settings are supported by ATProto API
        profileViewable: true,
        followsVisible: true,
        followersVisible: true,
        // Content visibility settings (may need custom implementation)
        postsVisible: true,
        repliesVisible: true,
        mentionsVisible: true,
    });

    useEffect(() => {
        loadPrivacySettings();
    }, []);

    const loadPrivacySettings = async () => {
        if (!session) return;
        
        try {
            setIsLoading(true);
            // Load privacy preferences from ATProto API
            const { data } = await agent.app.bsky.actor.getPreferences();
            
            // Parse privacy-related preferences
            const privacyPrefs = data.preferences.find(p => p.$type === 'app.bsky.actor.defs#privacyPref');
            if (privacyPrefs && 'profileViewable' in privacyPrefs) {
                // Map ATProto privacy preferences to local state
                setSettings({
                                         profileViewable: (privacyPrefs as any).profileViewable ?? true,
                     followsVisible: (privacyPrefs as any).followsVisible ?? true,
                     followersVisible: (privacyPrefs as any).followersVisible ?? true,
                     postsVisible: (privacyPrefs as any).postsVisible ?? true,
                     repliesVisible: (privacyPrefs as any).repliesVisible ?? true,
                     mentionsVisible: (privacyPrefs as any).mentionsVisible ?? true,
                });
            } else {
                // Default values if no privacy preferences found
                setSettings({
                    profileViewable: true,
                    followsVisible: true,
                    followersVisible: true,
                    postsVisible: true,
                    repliesVisible: true,
                    mentionsVisible: true,
                });
            }
        } catch (error) {
            console.error('Failed to load privacy settings:', error);
            toast({ 
                title: t('common.error'), 
                description: t('privacySettings.loadError'), 
                variant: "destructive" 
            });
            // Fallback to default values
            setSettings({
                profileViewable: true,
                followsVisible: true,
                followersVisible: true,
                postsVisible: true,
                repliesVisible: true,
                mentionsVisible: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const savePrivacySettings = async (newSettings: typeof settings) => {
        if (!session) return;
        
        // Save privacy preferences to ATProto API
        const { data: currentPrefs } = await agent.app.bsky.actor.getPreferences();
        const otherPrefs = currentPrefs.preferences.filter(p => p.$type !== 'app.bsky.actor.defs#privacyPref');
        
        // Create privacy preferences object
        const privacyPrefs = {
            $type: 'app.bsky.actor.defs#privacyPref',
            profileViewable: newSettings.profileViewable,
            followsVisible: newSettings.followsVisible,
            followersVisible: newSettings.followersVisible,
            postsVisible: newSettings.postsVisible,
            repliesVisible: newSettings.repliesVisible,
            mentionsVisible: newSettings.mentionsVisible,
        };
        
        await agent.app.bsky.actor.putPreferences({ 
            preferences: [...otherPrefs, privacyPrefs] 
        });
        
        toast({ 
            title: t('common.success'), 
            description: t('privacySettings.saveSuccess') 
        });
    };

    const { execute: executeSaveSettings, isLoading: isSavingDebounced } = useDebouncedAction(
        savePrivacySettings,
        1000
    );

    const handleSettingToggle = (key: keyof typeof settings, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        executeSaveSettings(newSettings);
    };

    return (
        <>
            <Head><title>{t('privacySettings.title')}</title></Head>
            <SettingsScreenLayout
                title={t('privacySettings.title')}
                description={t('privacySettings.description')}
            >
                <SettingsSection>
                    <SettingsListItem
                        icon={Globe}
                        label={t('privacySettings.profileViewable')}
                        sublabel={t('privacySettings.profileViewableDesc')}
                        control={
                            <Switch
                                checked={settings.profileViewable}
                                onChange={(value) => handleSettingToggle('profileViewable', value)}
                                disabled={isLoading || isSavingDebounced}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Users}
                        label={t('privacySettings.followsVisible')}
                        sublabel={t('privacySettings.followsVisibleDesc')}
                        control={
                            <Switch
                                checked={settings.followsVisible}
                                onChange={(value) => handleSettingToggle('followsVisible', value)}
                                disabled={isLoading || isSavingDebounced}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={UserCheck}
                        label={t('privacySettings.followersVisible')}
                        sublabel={t('privacySettings.followersVisibleDesc')}
                        control={
                            <Switch
                                checked={settings.followersVisible}
                                onChange={(value) => handleSettingToggle('followersVisible', value)}
                                disabled={isLoading || isSavingDebounced}
                            />
                        }
                    />
                </SettingsSection>

                <SettingsSection title={t('privacySettings.contentVisibility')}>
                    <SettingsListItem
                        icon={Eye}
                        label={t('privacySettings.postsVisible')}
                        sublabel={t('privacySettings.postsVisibleDesc')}
                        control={
                            <Switch
                                checked={settings.postsVisible}
                                onChange={(value) => handleSettingToggle('postsVisible', value)}
                                disabled={isLoading || isSavingDebounced}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={EyeOff}
                        label={t('privacySettings.repliesVisible')}
                        sublabel={t('privacySettings.repliesVisibleDesc')}
                        control={
                            <Switch
                                checked={settings.repliesVisible}
                                onChange={(value) => handleSettingToggle('repliesVisible', value)}
                                disabled={isLoading || isSavingDebounced}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Shield}
                        label={t('privacySettings.mentionsVisible')}
                        sublabel={t('privacySettings.mentionsVisibleDesc')}
                        control={
                            <Switch
                                checked={settings.mentionsVisible}
                                onChange={(value) => handleSettingToggle('mentionsVisible', value)}
                                disabled={isLoading || isSavingDebounced}
                            />
                        }
                    />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default PrivacySettingsScreen;
