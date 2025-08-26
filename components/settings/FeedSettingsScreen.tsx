import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useSavedFeeds } from '../../hooks/useSavedFeeds';
import { useToast } from '@/components/shared';
import { Rss, Pin, Settings, Plus, Trash2, RefreshCw } from 'lucide-react';
import Head from 'expo-router/head';
import { View, Pressable, Alert, Platform } from 'react-native';
import { theme } from '@/lib/theme';
import SettingsListItem from './SettingsListItem';
import { SettingsDivider, Switch } from '@/components/shared';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

const FeedSettingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { session, agent } = useAtp();
    const { preferences, feedViews, addFeed, removeFeed, togglePin } = useSavedFeeds();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState({
        // These settings are supported by ATProto API
        autoRefresh: true,
        showReposts: true,
        // These are app-specific settings
        showMediaOnly: true,
    });

    useEffect(() => {
        loadFeedSettings();
    }, []);

    const loadFeedSettings = async () => {
        if (!session) return;
        
        try {
            setIsLoading(true);
            // Load feed preferences from ATProto API
            const { data } = await agent.app.bsky.actor.getPreferences();
            
            // Parse feed-related preferences
            const feedPrefs = data.preferences.find(p => p.$type === 'app.bsky.actor.defs#feedPref');
            if (feedPrefs && 'autoRefresh' in feedPrefs) {
                // Map ATProto feed preferences to local state
                setSettings({
                                         autoRefresh: (feedPrefs as any).autoRefresh ?? true,
                     showReposts: (feedPrefs as any).showReposts ?? true,
                     showMediaOnly: (feedPrefs as any).showMediaOnly ?? false,
                });
            } else {
                // Default values if no feed preferences found
                setSettings({
                    autoRefresh: true,
                    showReposts: true,
                    showMediaOnly: false,
                });
            }
        } catch (error) {
            console.error('Failed to load feed settings:', error);
            // Fallback to default values
            setSettings({
                autoRefresh: true,
                showReposts: true,
                showMediaOnly: false,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingToggle = async (key: keyof typeof settings, value: boolean) => {
        if (!session) return;
        
        try {
            const newSettings = { ...settings, [key]: value };
            setSettings(newSettings);
            
            // Save feed preferences to ATProto API
            const { data: currentPrefs } = await agent.app.bsky.actor.getPreferences();
            const otherPrefs = currentPrefs.preferences.filter(p => p.$type !== 'app.bsky.actor.defs#feedPref');
            
            // Create feed preferences object
            const feedPrefs = {
                $type: 'app.bsky.actor.defs#feedPref',
                autoRefresh: newSettings.autoRefresh,
                showReposts: newSettings.showReposts,
                showMediaOnly: newSettings.showMediaOnly,
            };
            
            await agent.app.bsky.actor.putPreferences({ 
                preferences: [...otherPrefs, feedPrefs] 
            });
            
            toast({ 
                title: t('common.success'), 
                description: t('feedSettings.saveSuccess') 
            });
        } catch (error) {
            console.error('Failed to save feed setting:', error);
            toast({ 
                title: t('common.error'), 
                description: t('feedSettings.saveError'), 
                variant: "destructive" 
            });
            // Revert on failure
            setSettings(settings);
        }
    };

    const handlePinFeed = async (feedUri: string) => {
        try {
            await togglePin(feedUri);
        } catch (error) {
            console.error('Failed to pin feed:', error);
            toast({ 
                title: t('common.error'), 
                description: t('feedSettings.pinError'), 
                variant: "destructive" 
            });
        }
    };

    const handleUnpinFeed = async (feedUri: string) => {
        try {
            await togglePin(feedUri);
        } catch (error) {
            console.error('Failed to unpin feed:', error);
            toast({ 
                title: t('common.error'), 
                description: t('feedSettings.unpinError'), 
                variant: "destructive" 
            });
        }
    };

    const handleRemoveFeed = async (feedUri: string, feedName: string) => {
        const confirmRemove = () => {
            removeFeed(feedUri);
            toast({ 
                title: t('common.success'), 
                description: t('feedSettings.feedRemoved') 
            });
        };

        if (Platform.OS === 'web') {
            if (window.confirm(t('feedSettings.removeConfirm', { name: feedName }))) {
                confirmRemove();
            }
        } else {
            Alert.alert(
                t('feedSettings.removeFeed'),
                t('feedSettings.removeConfirm', { name: feedName }),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.remove'), style: 'destructive', onPress: confirmRemove },
                ],
                { cancelable: true }
            );
        }
    };

    return (
        <>
            <Head><title>{t('feedSettings.title')}</title></Head>
            <SettingsScreenLayout
                title={t('feedSettings.title')}
                description={t('feedSettings.description')}
            >
                <SettingsSection title={t('feedSettings.displayOptions')}>
                    <SettingsListItem
                        icon={RefreshCw}
                        label={t('feedSettings.autoRefresh')}
                        sublabel={t('feedSettings.autoRefreshDesc')}
                        control={
                            <Switch
                                checked={settings.autoRefresh}
                                onChange={(value) => handleSettingToggle('autoRefresh', value)}
                                disabled={isLoading}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Settings}
                        label={t('feedSettings.showMediaOnly')}
                        sublabel={t('feedSettings.showMediaOnlyDesc')}
                        control={
                            <Switch
                                checked={settings.showMediaOnly}
                                onChange={(value) => handleSettingToggle('showMediaOnly', value)}
                                disabled={isLoading}
                            />
                        }
                    />
                    <SettingsDivider />
                    <SettingsListItem
                        icon={Rss}
                        label={t('feedSettings.showReposts')}
                        sublabel={t('feedSettings.showRepostsDesc')}
                        control={
                            <Switch
                                checked={settings.showReposts}
                                onChange={(value) => handleSettingToggle('showReposts', value)}
                                disabled={isLoading}
                            />
                        }
                    />
                </SettingsSection>

                <SettingsSection title={t('feedSettings.pinnedFeeds')}>
                    {preferences?.items.filter(item => item.pinned).length === 0 ? (
                        <SettingsListItem
                            icon={Pin}
                            label={t('feedSettings.noPinnedFeeds')}
                            disabled
                        />
                    ) : (
                        preferences?.items.filter(item => item.pinned).map((item, index) => {
                            const feed = feedViews.get(item.value);
                            return (
                                <React.Fragment key={item.value}>
                                    <SettingsListItem
                                        icon={Pin}
                                        label={feed?.displayName || item.value}
                                        sublabel={feed?.description || item.value}
                                        value={t('feedSettings.pinned')}
                                        onPress={() => handleUnpinFeed(item.value)}
                                    />
                                    {index < preferences.items.filter(item => item.pinned).length - 1 && <SettingsDivider />}
                                </React.Fragment>
                            );
                        })
                    )}
                </SettingsSection>

                <SettingsSection title={t('feedSettings.savedFeeds')}>
                    {preferences?.items.length === 0 ? (
                        <SettingsListItem
                            icon={Rss}
                            label={t('feedSettings.noSavedFeeds')}
                            disabled
                        />
                    ) : (
                        preferences?.items.map((item, index) => {
                            const feed = feedViews.get(item.value);
                            return (
                                <React.Fragment key={item.value}>
                                    <SettingsListItem
                                        icon={Rss}
                                        label={feed?.displayName || item.value}
                                        sublabel={feed?.description || item.value}
                                        control={
                                            <View style={{flexDirection: 'row', gap: 8}}>
                                                <Pressable
                                                    onPress={() => handlePinFeed(item.value)}
                                                    style={({pressed}) => [
                                                        {padding: 8, borderRadius: 4},
                                                        pressed && {opacity: 0.7}
                                                    ]}
                                                >
                                                    <Pin color={theme.colors.primary} size={16} />
                                                </Pressable>
                                                <Pressable
                                                    onPress={() => handleRemoveFeed(item.value, feed?.displayName || item.value)}
                                                    style={({pressed}) => [
                                                        {padding: 8, borderRadius: 4},
                                                        pressed && {opacity: 0.7}
                                                    ]}
                                                >
                                                    <Trash2 color={theme.colors.error} size={16} />
                                                </Pressable>
                                            </View>
                                        }
                                    />
                                    {index < preferences.items.length - 1 && <SettingsDivider />}
                                </React.Fragment>
                            );
                        })
                    )}
                </SettingsSection>
            </SettingsScreenLayout>
        </>
    );
};

export default FeedSettingsScreen;
