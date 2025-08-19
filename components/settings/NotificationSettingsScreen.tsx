import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import ScreenHeader from '../layout/ScreenHeader';
import { Heart, UserPlus, MessageCircle, AtSign, Repeat, Quote, Bell, Loader2 } from 'lucide-react';
import { useHeadManager } from '../../hooks/useHeadManager';
import ToggleSwitch from '../ui/ToggleSwitch';

const PUSH_SERVICE_DID = 'did:web:push.bsky.app';
const APP_ID = 'social.takaka.app'; // A unique identifier for our app

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
        quote: true,
    });
    type SettingsKey = keyof typeof settings;

    useHeadManager({ title: t('notificationSettings.title') });

    // Load initial settings from preferences and browser permissions
    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            setPushEnabled(Notification.permission === 'granted');
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
                        quote: !disabledSet.has('quote'),
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
            // Persist the preferences on the user's account
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

            toast({ title: "Settings saved" });
        } catch (error) {
            console.error("Failed to save notification settings:", error);
            toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }, [agent, toast]);
    
    const handleSettingToggle = (key: SettingsKey, value: boolean) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        saveSettings(newSettings);
    };

    const handleMasterToggle = async (enabled: boolean) => {
        if (enabled) {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast({ title: "Permission Denied", description: "You need to grant permission in your browser settings to enable notifications.", variant: "destructive"});
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
                toast({ title: "Push notifications enabled!" });
            } catch (error) {
                console.error("Failed to subscribe to push notifications:", error);
                toast({ title: "Error", description: "Could not enable push notifications.", variant: "destructive"});
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
                toast({ title: "Push notifications disabled" });
            } catch (error) {
                console.error("Failed to unsubscribe:", error);
                toast({ title: "Error", description: "Could not disable notifications.", variant: "destructive"});
            } finally {
                setIsSaving(false);
            }
        }
    };

    const settingsItems = [
        { key: 'like' as SettingsKey, icon: Heart, title: 'Likes' },
        { key: 'repost' as SettingsKey, icon: Repeat, title: 'Reposts' },
        { key: 'follow' as SettingsKey, icon: UserPlus, title: 'Follows' },
        { key: 'reply' as SettingsKey, icon: MessageCircle, title: 'Replies' },
        { key: 'mention' as SettingsKey, icon: AtSign, title: 'Mentions' },
        { key: 'quote' as SettingsKey, icon: Quote, title: 'Quotes' },
    ];

    if (isLoading) {
        return (
            <div>
                <ScreenHeader title="Notifications" />
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div>
            <ScreenHeader title="Notifications" />
            <div className="mt-4 space-y-4">
                 <div className="bg-surface-2 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Bell className="w-6 h-6 text-on-surface-variant" />
                        <div>
                            <p className="font-semibold">Enable Push Notifications</p>
                            <p className="text-sm text-on-surface-variant">Get alerts on your device</p>
                        </div>
                    </div>
                    <ToggleSwitch checked={pushEnabled} onChange={handleMasterToggle} disabled={isSaving} />
                </div>

                <div className={`transition-opacity duration-300 ${!pushEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="font-bold text-on-surface-variant px-2 my-2">Notify me about...</h3>
                    <div className="bg-surface-2 rounded-lg divide-y divide-outline">
                         {settingsItems.map((item) => (
                            <div key={item.key} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <item.icon className="w-6 h-6 text-on-surface-variant" />
                                    <p className="font-semibold">{item.title}</p>
                                </div>
                                <ToggleSwitch
                                    checked={settings[item.key]}
                                    onChange={(checked) => handleSettingToggle(item.key, checked)}
                                    disabled={isSaving}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsScreen;