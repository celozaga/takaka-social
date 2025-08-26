
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { Ionicons } from '@expo/vector-icons';
import Head from 'expo-router/head';
import ToggleSwitch from '../ui/ToggleSwitch';
import { View, ActivityIndicator, Platform } from 'react-native';
import { theme } from '@/lib/theme';
import SettingsListItem from './SettingsListItem';
import SettingsDivider from '@/components/ui/SettingsDivider';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const PUSH_SERVICE_DID = 'did:web:push.bsky.app';
const APP_ID = 'social.takaka.app';

interface PushNotificationsPref {
    $type: 'app.bsky.actor.defs#pushNotificationsPref';
    primary?: {
        enabled: boolean;
        disabled: string[];
    }
}

const NotificationSettingsScreen: React.FC = () => {
    const { agent } = useAtp();
    const { toast } = useToast();
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [settings, setSettings] = useState({
        like: true,
        repost: true,
        follow: true,
        reply: true,
        mention: true,
    });
    type SettingsKey = keyof typeof settings;

    // Check if running in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';

    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            
            // Skip notifications in Expo Go due to SDK 53 limitations
            if (isExpoGo) {
                setPushEnabled(false);
                setIsLoading(false);
                return;
            }
            
            try {
                const { status } = await Notifications.getPermissionsAsync();
                setPushEnabled(status === 'granted');
            } catch (error) {
                console.warn('Notifications not available:', error);
                setPushEnabled(false);
            }
            
            try {
                const { data } = await agent.app.bsky.actor.getPreferences();
                const pushPref = data.preferences.find(
                    (p): p is PushNotificationsPref => p.$type === 'app.bsky.actor.defs#pushNotificationsPref'
                );
                
                if (pushPref && pushPref.primary && Array.isArray(pushPref.primary.disabled)) {
                    const disabledSet = new Set(pushPref.primary.disabled);
                    setSettings({
                        like: !disabledSet.has('like'),
                        repost: !disabledSet.has('repost'),
                        follow: !disabledSet.has('follow'),
                        reply: !disabledSet.has('reply'),
                        mention: !disabledSet.has('mention'),
                    });
                }
            } catch (error) {
                console.error("Failed to load notification preferences:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, [agent]);

    const saveSettings = useCallback(async (newSettings: typeof settings) => {
        setIsSaving(true);
        const disabledReasons = (Object.keys(newSettings) as SettingsKey[])
            .filter(key => !newSettings[key]);

        try {
            const { data: currentPrefs } = await agent.app.bsky.actor.getPreferences();
            const otherPrefs = currentPrefs.preferences.filter(p => p.$type !== 'app.bsky.actor.defs#pushNotificationsPref');
            
            const pushPref: PushNotificationsPref = {
                $type: 'app.bsky.actor.defs#pushNotificationsPref',
                primary: {
                    enabled: true,
                    disabled: disabledReasons,
                }
            };

            await agent.app.bsky.actor.putPreferences({
                preferences: [...otherPrefs, pushPref]
            });

            setSettings(newSettings);
            toast({ title: t('common.success'), description: t('notificationSettings.toast.saved') });
        } catch (error) {
            console.error("Failed to save notification preferences:", error);
            toast({ title: t('common.error'), description: t('notificationSettings.toast.saveError'), variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [agent, toast, t]);

    const handleSettingToggle = useCallback(async (key: SettingsKey, checked: boolean) => {
        const newSettings = { ...settings, [key]: checked };
        await saveSettings(newSettings);
    }, [settings, saveSettings]);

    const handleMasterToggle = async (enabled: boolean) => {
        if (enabled) {
            try {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== 'granted') {
                    toast({ title: t('notificationSettings.toast.permissionDenied'), description: t('notificationSettings.toast.permissionDeniedDescription'), variant: "destructive"});
                    return;
                }
                setIsSaving(true);
                const token = (await Notifications.getExpoPushTokenAsync()).data;

                await agent.app.bsky.notification.registerPush({
                    serviceDid: PUSH_SERVICE_DID,
                    token,
                    platform: Platform.OS,
                    appId: APP_ID,
                });
                setPushEnabled(true);
                toast({ title: t('notificationSettings.toast.enabled') });
            } catch (error) {
                console.error("Failed to subscribe to push notifications:", error);
                toast({ title: t('common.error'), description: t('notificationSettings.toast.enableError'), variant: "destructive"});
                setPushEnabled(false);
            } finally {
                setIsSaving(false);
            }
        } else {
            // Note: Unregistering push tokens is not a standard part of the atproto spec.
            // The user can disable notifications from the device settings.
            // We'll update the UI to reflect their choice within the app.
            setPushEnabled(false);
            toast({ title: t('notificationSettings.toast.disabled') });
        }
    };

    const settingsItems = [
        { key: 'like' as SettingsKey, icon: (props: any) => <Ionicons name="heart-outline" {...props} />, title: t('notifications.likedYourPost', { author: '' }).trim() },
        { key: 'repost' as SettingsKey, icon: (props: any) => <Ionicons name="repeat-outline" {...props} />, title: t('notifications.reposts') },
        { key: 'follow' as SettingsKey, icon: (props: any) => <Ionicons name="person-add-outline" {...props} />, title: t('notifications.follows') },
        { key: 'reply' as SettingsKey, icon: (props: any) => <Ionicons name="chatbubble-outline" {...props} />, title: t('common.replies') },
        { key: 'mention' as SettingsKey, icon: (props: any) => <Ionicons name="at-outline" {...props} />, title: t('notifications.mentions') },
    ];

    if (isLoading) {
        return (
            <SettingsScreenLayout title={t('notificationSettings.title')}>
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size="large" color={theme.colors.onSurface} />
                </View>
            </SettingsScreenLayout>
        )
    }

    return (
        <>
            <Head><title>{t('notificationSettings.title')}</title></Head>
            <SettingsScreenLayout title={t('notificationSettings.title')}>
                <SettingsSection>
                    <SettingsListItem
                        icon={(props: any) => <Ionicons name="notifications-outline" {...props} />}
                        label={t('notificationSettings.enablePush')}
                        sublabel={t('notificationSettings.getAlerts')}
                        control={<ToggleSwitch checked={pushEnabled} onChange={handleMasterToggle} disabled={isSaving} />}
                    />
                </SettingsSection>

                <SettingsSection title={t('notificationSettings.notifyMeAbout')}>
                    {settingsItems.map((item, index) => (
                        <React.Fragment key={item.key}>
                            <SettingsListItem
                                icon={item.icon}
                                label={item.title}
                                control={
                                    <ToggleSwitch
                                        checked={settings[item.key]}
                                        onChange={(checked) => handleSettingToggle(item.key, checked)}
                                        disabled={isSaving || !pushEnabled}
                                    />
                                }
                            />
                            {index < settingsItems.length - 1 && <SettingsDivider />}
                        </React.Fragment>
                    ))}
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default NotificationSettingsScreen;
