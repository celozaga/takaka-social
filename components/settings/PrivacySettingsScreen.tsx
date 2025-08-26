import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { Lock, Eye, EyeOff, Shield, Users, UserCheck, Globe } from 'lucide-react';
import Head from 'expo-router/head';
import SettingsListItem from './SettingsListItem';
import SettingsDivider from '@/components/ui/SettingsDivider';
import ToggleSwitch from '../ui/ToggleSwitch';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

const PrivacySettingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
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
            if (privacyPrefs) {
                // TODO: Map ATProto privacy preferences to local state
                // For now, using default values
                setSettings({
                    profileViewable: true,
                    followsVisible: true,
                    followersVisible: true,
                    postsVisible: true,
                    repliesVisible: true,
                    mentionsVisible: true,
                });
            } else {
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
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingToggle = async (key: keyof typeof settings, value: boolean) => {
        if (!session) return;
        
        try {
            setIsSaving(true);
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);
            
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
        } catch (error) {
            console.error('Failed to save privacy setting:', error);
            toast({ 
                title: t('common.error'), 
                description: t('privacySettings.saveError'), 
                variant: "destructive" 
            });
            // Revert on failure
            setSettings(settings);
        } finally {
            setIsSaving(false);
        }
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
                            <ToggleSwitch
                                checked={settings.profileViewable}
                                onChange={(value) => handleSettingToggle('profileViewable', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Users}
                        label={t('privacySettings.followsVisible')}
                        sublabel={t('privacySettings.followsVisibleDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.followsVisible}
                                onChange={(value) => handleSettingToggle('followsVisible', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={UserCheck}
                        label={t('privacySettings.followersVisible')}
                        sublabel={t('privacySettings.followersVisibleDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.followersVisible}
                                onChange={(value) => handleSettingToggle('followersVisible', value)}
                                disabled={isLoading || isSaving}
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
                            <ToggleSwitch
                                checked={settings.postsVisible}
                                onChange={(value) => handleSettingToggle('postsVisible', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={EyeOff}
                        label={t('privacySettings.repliesVisible')}
                        sublabel={t('privacySettings.repliesVisibleDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.repliesVisible}
                                onChange={(value) => handleSettingToggle('repliesVisible', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Shield}
                        label={t('privacySettings.mentionsVisible')}
                        sublabel={t('privacySettings.mentionsVisibleDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.mentionsVisible}
                                onChange={(value) => handleSettingToggle('mentionsVisible', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default PrivacySettingsScreen;
