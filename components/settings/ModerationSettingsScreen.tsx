import React from 'react';
import { useTranslation } from 'react-i18next';
import { useModeration } from '../../context/ModerationContext';
import { Shield, Filter, Users, UserX, MicOff } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch';
import SettingsListItem from './SettingsListItem';
import { ActivityIndicator } from 'react-native';
import SettingsDivider from '@/components/ui/SettingsDivider';
import SettingsScreenLayout, { SettingsSection } from './SettingsScreenLayout';

const BLUESKY_OFFICIAL_MOD_SERVICE = 'did:plc:z72i7hdynmk6r22z27h6tvur';

const ModerationSettingsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { isReady, adultContentEnabled, setAdultContentEnabled } = useModeration();

    return (
        <SettingsScreenLayout title={t('settings.moderation.title')}>
            <SettingsSection>
                <SettingsListItem icon={Filter} label={t('settings.moderation.mutedWordsAndTags')} href="/settings/muted-words" />
                <SettingsDivider />
                <SettingsListItem icon={Users} label={t('settings.moderation.moderationLists')} href="/settings/moderation/lists" />
                <SettingsDivider />
                <SettingsListItem icon={MicOff} label={t('settings.mutedAccounts')} href="/settings/muted-accounts" />
                <SettingsDivider />
                <SettingsListItem icon={UserX} label={t('settings.moderation.blockedAccounts')} href="/settings/blocked-accounts" />
            </SettingsSection>
            
            <SettingsSection title={t('settings.moderation.contentFilters')}>
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
            </SettingsSection>

             <SettingsSection title={t('settings.moderation.advanced')}>
                <SettingsListItem
                    icon={Shield}
                    label="Bluesky Moderation Service"
                    sublabel="Official Bluesky moderation service."
                    href={`/settings/mod-service/${BLUESKY_OFFICIAL_MOD_SERVICE}`}
                />
            </SettingsSection>
        </SettingsScreenLayout>
    );
};

export default ModerationSettingsScreen;
