import React from 'react';
import { useModeration } from '../../context/ModerationContext';
import ScreenHeader from '../layout/ScreenHeader';
import { Shield, Filter, Users, MessageSquare, UserX } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch';
import SettingsListItem from './SettingsListItem';
import { View, Text, ActivityIndicator } from 'react-native';
import { settingsStyles } from '@/lib/theme';

const SettingsDivider = () => <View style={settingsStyles.divider} />;

const BLUESKY_OFFICIAL_MOD_SERVICE = 'did:plc:z72i7hdynmk6r22z27h6tvur';

const ModerationSettingsScreen: React.FC = () => {
    const { isReady, adultContentEnabled, setAdultContentEnabled } = useModeration();

    return (
        <View>
            <ScreenHeader title="Moderation" />
            <View style={settingsStyles.container}>
                <View style={settingsStyles.section}>
                    <SettingsListItem icon={Filter} label="Muted words & tags" href="/settings/muted-words" />
                    <SettingsDivider />
                    <SettingsListItem icon={Users} label="Moderation lists" href="#" disabled />
                    <SettingsDivider />
                    <SettingsListItem icon={MessageSquare} label="Muted accounts" href="#" disabled />
                    <SettingsDivider />
                    <SettingsListItem icon={UserX} label="Blocked accounts" href="#" disabled />
                </View>
                
                <View>
                    <Text style={settingsStyles.sectionHeader}>Content filters</Text>
                    <View style={settingsStyles.section}>
                        <SettingsListItem
                            icon={Shield}
                            label="Enable adult content"
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
                    <Text style={settingsStyles.sectionHeader}>Advanced</Text>
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