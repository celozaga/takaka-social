
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import ScreenHeader from '../layout/ScreenHeader';
import { Heart, UserPlus, MessageCircle, AtSign, Repeat, Bell } from 'lucide-react';
import Head from '../shared/Head';
import ToggleSwitch from '../ui/ToggleSwitch';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';
import SettingsListItem from './SettingsListItem';
import SettingsDivider from '@/components/ui/SettingsDivider';

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

    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            if (typeof Notification !== 'undefined') {
              setPushEnabled(Notification.permission === 'granted');
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
            
            await agent.app.bsky.actor.putPreferences({
                preferences: [
                    ...otherPrefs,
                    {
                        $type: 'app.bsky.actor.defs#pushNotificationsPref',
                        primary: { enabled: true, disabled: disabledReasons }
                    } as any,
                ]
            });

            toast({ title: t('notificationSettings.toast.saveSuccess') });
        } catch (error) {
            console.error("Failed to save notification settings:", error);
            toast({ title: "Error", description: t('notificationSettings.toast.saveError'), variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [agent, toast, t]);
    
    const handleSettingToggle = (key: SettingsKey, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };

    const handleMasterToggle = async (enabled: boolean) => {
       if (typeof Notification === 'undefined' || typeof navigator.serviceWorker === 'undefined') {
            toast({ title: "Unsupported", description: "Push notifications are not supported on this device or browser.", variant: "destructive"});
            return;
        }

        if (enabled) {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast({ title: t('notificationSettings.toast.permissionDenied'), description: t('notificationSettings.toast.permissionDeniedDescription'), variant: "destructive"});
                return;
            }
            try {
                setIsSaving(true);
                const serviceWorker = await navigator.serviceWorker.ready;
                const subscription = await serviceWorker.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: 'BF-2_IFJ2xM24vA2p9a-gQIc37Hr5yS90Pbo7gPltQ9FNCjYl7uD7sBPlsHeOdK00mKYT1vplg9M2a3WjmTEkYA'
                });

                await agent.app.bsky.notification.registerPush({
                    serviceDid: PUSH_SERVICE_DID,
                    token: JSON.stringify(subscription),
                    platform: 'web',
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
             try {
                setIsSaving(true);
                const serviceWorker = await navigator.serviceWorker.ready;
                const subscription = await serviceWorker.pushManager.getSubscription();
                if (subscription) {
                    await subscription.unsubscribe();
                }
                setPushEnabled(false);
                toast({ title: t('notificationSettings.toast.disabled') });
            } catch (error) {
                console.error("Failed to unsubscribe:", error);
                toast({ title: t('common.error'), description: t('notificationSettings.toast.disableError'), variant: "destructive"});
            } finally {
                setIsSaving(false);
            }
        }
    };

    const settingsItems = [
        { key: 'like' as SettingsKey, icon: Heart, title: t('notifications.likedYourPost', { author: '' }).trim() },
        { key: 'repost' as SettingsKey, icon: Repeat, title: t('notifications.reposts') },
        { key: 'follow' as SettingsKey, icon: UserPlus, title: t('notifications.follows') },
        { key: 'reply' as SettingsKey, icon: MessageCircle, title: t('common.replies') },
        { key: 'mention' as SettingsKey, icon: AtSign, title: t('notifications.mentions') },
    ];

    if (isLoading) {
        return (
            <View style={{flex: 1}}>
                <ScreenHeader title={t('notificationSettings.title')} />
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <ActivityIndicator size="large" color={theme.colors.onSurface} />
                </View>
            </View>
        )
    }

    return (
        <>
            <Head><title>{t('notificationSettings.title')}</title></Head>
            <View style={{flex: 1}}>
                <ScreenHeader title={t('notificationSettings.title')} />
                <ScrollView contentContainerStyle={theme.settingsStyles.container}>
                     <View style={theme.settingsStyles.section}>
                        <SettingsListItem
                            icon={Bell}
                            label={t('notificationSettings.enablePush')}
                            sublabel={t('notificationSettings.getAlerts')}
                            control={<ToggleSwitch checked={pushEnabled} onChange={handleMasterToggle} disabled={isSaving} />}
                        />
                    </View>

                    <View style={!pushEnabled ? theme.settingsStyles.disabled : undefined}>
                        <Text style={theme.settingsStyles.sectionHeader}>{t('notificationSettings.notifyMeAbout')}</Text>
                        <View style={theme.settingsStyles.section}>
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
                        </View>
                    </View>
                </ScrollView>
            </View>
        </>
    );
};

export default NotificationSettingsScreen;
