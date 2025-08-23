import React from 'react';
import { useTranslation } from 'react-i18next';
import { useModeration } from '../../context/ModerationContext';
import ScreenHeader from '../layout/ScreenHeader';
import { Shield, Filter, Users, UserX, MicOff } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch';
import SettingsListItem from './SettingsListItem';
import { View, Text, ActivityIndicator } from 'react-native';
import { settingsStyles } from '@/lib/theme';

const SettingsDivider = () => <View style={settingsStyles.divider} />;

const BLUESKY_OFFICIAL_MOD_SERVICE = 'did:plc:z72i7hdynmk6r22z27h6tvur';

const ModerationSettingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { isReady, adultContentEnabled, setAdultContentEnabled } = useModeration();

    return (
        <View>
            <ScreenHeader title={t('settings.moderation.title')} />
            <View style={settingsStyles.container}>
                <View style={settingsStyles.section}>
                    <SettingsListItem icon={Filter} label={t('settings.moderation.mutedWordsAndTags')} href="/settings/muted-words" />
                    <SettingsDivider />
                    <SettingsListItem icon={Users} label={t('settings.moderation.moderationLists')} href="#" disabled />
                    <SettingsDivider />
                    <SettingsListItem icon={MicOff} label={t('settings.mutedAccounts')} href="/settings/muted-accounts" />
                    <SettingsDivider />
                    <SettingsListItem icon={UserX} label={t('settings.moderation.blockedAccounts')} href="#" disabled />
                </View>
                
                <View>
                    <Text style={settingsStyles.sectionHeader}>{t('settings.moderation.contentFilters')}</Text>
                    <View style={settingsStyles.section}>
                        <SettingsListItem
                            icon={Shield}
                            label={t('settings.moderation.enableAdultContent')}
                            control={
                                isReady ? (
                                    <ToggleSwitch checked={adultContentEnabled} onChange={setAdultContentEnabled} />
                                ) : (
                                    <ActivityIndicator />
                                )
                            }
                        />
                    </View>
                </View>

                 <View>
                    <Text style={settingsStyles.sectionHeader}>{t('settings.moderation.advanced')}</Text>
                    <View style={settingsStyles.section}>
                        <SettingsListItem
                            icon={Shield}
                            label="Bluesky Moderation Service"
                            sublabel="Official Bluesky moderation service."
                            href={`/settings/mod-service/${BLUESKY_OFFICIAL_MOD_SERVICE}`}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

export default ModerationSettingsScreen;