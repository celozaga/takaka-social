import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { Eye, Volume2, Smartphone, Zap, Type, Contrast, Move, Play } from 'lucide-react';
import Head from 'expo-router/head';
import ToggleSwitch from '../ui/ToggleSwitch';
import SettingsListItem from './SettingsListItem';
import SettingsDivider from '@/components/ui/SettingsDivider';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESSIBILITY_STORAGE_KEY = 'accessibility_settings';

interface AccessibilitySettings {
    // Visual
    reduceMotion: boolean;
    increaseContrast: boolean;
    largerText: boolean;
    boldText: boolean;
    // Media
    autoPlayVideos: boolean;
    showAltText: boolean;
    // Interaction
    soundEffects: boolean;
    hapticFeedback: boolean;
}

const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
    reduceMotion: false,
    increaseContrast: false,
    largerText: false,
    boldText: false,
    autoPlayVideos: true,
    showAltText: true,
    soundEffects: true,
    hapticFeedback: true,
};

const AccessibilitySettingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { session } = useAtp();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY_SETTINGS);

    useEffect(() => {
        loadAccessibilitySettings();
    }, []);

    const loadAccessibilitySettings = async () => {
        try {
            setIsLoading(true);
            // Load accessibility settings from local storage
            const storedSettings = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
            if (storedSettings) {
                const parsedSettings = JSON.parse(storedSettings);
                setSettings({ ...DEFAULT_ACCESSIBILITY_SETTINGS, ...parsedSettings });
            } else {
                setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
            }
        } catch (error) {
            console.error('Failed to load accessibility settings:', error);
            toast({ 
                title: t('common.error'), 
                description: t('accessibilitySettings.loadError'), 
                variant: "destructive" 
            });
            // Fallback to default settings
            setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingToggle = async (key: keyof AccessibilitySettings, value: boolean) => {
        try {
            setIsSaving(true);
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);
            
            // Save accessibility preferences to local storage
            await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(newSettings));
            
            // Apply accessibility changes immediately
            applyAccessibilitySettings(newSettings);
            
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

    const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
        // Apply visual accessibility settings
        if (newSettings.reduceMotion) {
            // TODO: Implement motion reduction
            console.log('Motion reduction enabled');
        }
        
        if (newSettings.increaseContrast) {
            // TODO: Implement contrast increase
            console.log('Contrast increase enabled');
        }
        
        if (newSettings.largerText) {
            // TODO: Implement larger text
            console.log('Larger text enabled');
        }
        
        if (newSettings.boldText) {
            // TODO: Implement bold text
            console.log('Bold text enabled');
        }
        
        // Apply media accessibility settings
        if (newSettings.autoPlayVideos) {
            // TODO: Implement auto-play videos
            console.log('Auto-play videos enabled');
        }
        
        if (newSettings.showAltText) {
            // TODO: Implement alt text display
            console.log('Alt text display enabled');
        }
        
        // Apply interaction accessibility settings
        if (newSettings.soundEffects) {
            // TODO: Implement sound effects
            console.log('Sound effects enabled');
        }
        
        if (newSettings.hapticFeedback) {
            // TODO: Implement haptic feedback
            console.log('Haptic feedback enabled');
        }
    };

    if (isLoading) {
        return (
            <SettingsScreenLayout title={t('accessibilitySettings.title')}>
                <SettingsSection>
                    <SettingsListItem
                        icon={Eye}
                        label={t('accessibilitySettings.loading')}
                        value="..."
                        disabled
                    />
                </SettingsSection>
            </SettingsScreenLayout>
        );
    }

    return (
        <>
            <Head><title>{t('accessibilitySettings.title')}</title></Head>
            <SettingsScreenLayout 
                title={t('accessibilitySettings.title')}
                description={t('accessibilitySettings.description')}
            >
                <SettingsSection title={t('accessibilitySettings.visual')}>
                    <SettingsListItem
                        icon={Move}
                        label={t('accessibilitySettings.reduceMotion')}
                        sublabel={t('accessibilitySettings.reduceMotionDesc')}
                        control={
                            <ToggleSwitch 
                                checked={settings.reduceMotion} 
                                onChange={(value) => handleSettingToggle('reduceMotion', value)}
                                disabled={isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Contrast}
                        label={t('accessibilitySettings.increaseContrast')}
                        sublabel={t('accessibilitySettings.increaseContrastDesc')}
                        control={
                            <ToggleSwitch 
                                checked={settings.increaseContrast} 
                                onChange={(value) => handleSettingToggle('increaseContrast', value)}
                                disabled={isSaving}
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
                                disabled={isSaving}
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
                                disabled={isSaving}
                            />
                        }
                    />
                </SettingsSection>

                <SettingsSection title={t('accessibilitySettings.media')}>
                    <SettingsListItem
                        icon={Play}
                        label={t('accessibilitySettings.autoPlayVideos')}
                        sublabel={t('accessibilitySettings.autoPlayVideosDesc')}
                        control={
                            <ToggleSwitch 
                                checked={settings.autoPlayVideos} 
                                onChange={(value) => handleSettingToggle('autoPlayVideos', value)}
                                disabled={isSaving}
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
                                disabled={isSaving}
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
                                disabled={isSaving}
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
                                disabled={isSaving}
                            />
                        }
                    />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default AccessibilitySettingsScreen;
