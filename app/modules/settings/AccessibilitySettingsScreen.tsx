import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useToast, Switch, SettingsDivider } from '@/components/shared';
import { Eye, Volume2, Smartphone, Zap, Type, Contrast, Move, Play } from 'lucide-react';
import Head from 'expo-router/head';
import SettingsListItem from './SettingsListItem';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';
import AccessibilityTest from '../shared/AccessibilityTest';

const ACCESSIBILITY_STORAGE_KEY = 'accessibility_settings';

// Remove the interface and default settings as they're now in the context

const AccessibilitySettingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { session } = useAtp();
    const { toast } = useToast();
    const { settings, updateSetting } = useAccessibility();
    const [isSaving, setIsSaving] = useState(false);

    const handleSettingToggle = async (key: keyof typeof settings, value: boolean) => {
        try {
            setIsSaving(true);
            await updateSetting(key, value);
            
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
        } finally {
            setIsSaving(false);
        }
    };

    // Remove loading state as it's handled by the context

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
                            <Switch 
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
                            <Switch 
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
                            <Switch 
                                checked={settings.largerText} 
                                onChange={(value) => handleSettingToggle('largerText', value)}
                                disabled={isSaving}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Type}
                        label={t('accessibilitySettings.increaseFontSize')}
                        sublabel={t('accessibilitySettings.increaseFontSizeDesc')}
                        control={
                            <Switch 
                                checked={settings.increaseFontSize} 
                                onChange={(value) => handleSettingToggle('increaseFontSize', value)}
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
                            <Switch 
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
                            <Switch 
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
                            <Switch 
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
                            <Switch 
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
                            <Switch 
                                checked={settings.hapticFeedback} 
                                onChange={(value) => handleSettingToggle('hapticFeedback', value)}
                                disabled={isSaving}
                            />
                        }
                    />
                </SettingsSection>

                <SettingsSection title="Preview">
                    <AccessibilityTest />
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default AccessibilitySettingsScreen;
