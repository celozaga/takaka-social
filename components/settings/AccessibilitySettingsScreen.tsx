import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { Eye, Volume2, Smartphone, Palette, Type, Zap } from 'lucide-react';
import Head from 'expo-router/head';
import SettingsListItem from './SettingsListItem';
import SettingsDivider from '@/components/ui/SettingsDivider';
import ToggleSwitch from '../ui/ToggleSwitch';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

const AccessibilitySettingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { session } = useAtp();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        // These are app-specific accessibility settings
        reduceMotion: false,
        increaseContrast: false,
        largerText: false,
        boldText: false,
        autoPlayVideos: true,
        showAltText: true,
        soundEffects: true,
        hapticFeedback: true,
    });

    useEffect(() => {
        loadAccessibilitySettings();
    }, []);

    const loadAccessibilitySettings = async () => {
        if (!session) return;
        
        try {
            setIsLoading(true);
            // Load accessibility preferences from local storage or app config
            // These are app-specific settings, not ATProto preferences
            setSettings({
                reduceMotion: false,
                increaseContrast: false,
                largerText: false,
                boldText: false,
                autoPlayVideos: true,
                showAltText: true,
                soundEffects: true,
                hapticFeedback: true,
            });
        } catch (error) {
            console.error('Failed to load accessibility settings:', error);
            toast({ 
                title: t('common.error'), 
                description: t('accessibilitySettings.loadError'), 
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
            
            // Save accessibility preferences to local storage
            // These are app-specific settings, not ATProto preferences
            // TODO: Implement AsyncStorage or similar for local persistence
            
            toast({ 
                title: t('common.success'), 
                description: t('accessibilitySettings.saveSuccess') 
            });
        } catch (error) {
            console.error('Failed to save accessibility setting:', error);
            toast({ 
                title: t('common.error'), 
                description: t('accessibilitySettings.saveError'), 
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
            <Head><title>{t('accessibilitySettings.title')}</title></Head>
            <SettingsScreenLayout
                title={t('accessibilitySettings.title')}
                description={t('accessibilitySettings.description')}
            >
                <SettingsSection title={t('accessibilitySettings.visual')}>
                    <SettingsListItem
                        icon={Eye}
                        label={t('accessibilitySettings.reduceMotion')}
                        sublabel={t('accessibilitySettings.reduceMotionDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.reduceMotion}
                                onChange={(value) => handleSettingToggle('reduceMotion', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Palette}
                        label={t('accessibilitySettings.increaseContrast')}
                        sublabel={t('accessibilitySettings.increaseContrastDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.increaseContrast}
                                onChange={(value) => handleSettingToggle('increaseContrast', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Type}
                        label={t('accessibilitySettings.largerText')}
                        sublabel={t('accessibilitySettings.largerTextDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.largerText}
                                onChange={(value) => handleSettingToggle('largerText', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Type}
                        label={t('accessibilitySettings.boldText')}
                        sublabel={t('accessibilitySettings.boldTextDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.boldText}
                                onChange={(value) => handleSettingToggle('boldText', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                </SettingsSection>

                <SettingsSection title={t('accessibilitySettings.media')}>
                    <SettingsListItem
                        icon={Zap}
                        label={t('accessibilitySettings.autoPlayVideos')}
                        sublabel={t('accessibilitySettings.autoPlayVideosDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.autoPlayVideos}
                                onChange={(value) => handleSettingToggle('autoPlayVideos', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Eye}
                        label={t('accessibilitySettings.showAltText')}
                        sublabel={t('accessibilitySettings.showAltTextDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.showAltText}
                                onChange={(value) => handleSettingToggle('showAltText', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                </SettingsSection>

                <SettingsSection title={t('accessibilitySettings.interaction')}>
                    <SettingsListItem
                        icon={Volume2}
                        label={t('accessibilitySettings.soundEffects')}
                        sublabel={t('accessibilitySettings.soundEffectsDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.soundEffects}
                                onChange={(value) => handleSettingToggle('soundEffects', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Smartphone}
                        label={t('accessibilitySettings.hapticFeedback')}
                        sublabel={t('accessibilitySettings.hapticFeedbackDesc')}
                        control={
                            <ToggleSwitch
                                checked={settings.hapticFeedback}
                                onChange={(value) => handleSettingToggle('hapticFeedback', value)}
                                disabled={isLoading || isSaving}
                            />
                        }
                    />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default AccessibilitySettingsScreen;
