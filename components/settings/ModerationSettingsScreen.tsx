import React from 'react';
import { useModeration } from '../../context/ModerationContext';
import ScreenHeader from '../layout/ScreenHeader';
import { ChevronRight, Shield, Filter, Users, MessageSquare, UserX } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Link } from 'expo-router';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';

const SettingsItem: React.FC<{
    icon: React.FC<any>;
    title: string;
    subtitle?: string;
    href: string;
    disabled?: boolean;
}> = ({ icon: Icon, title, subtitle, href, disabled }) => {
    const content = (
        <View style={[styles.settingsItemInner, disabled && styles.disabled]}>
            <View style={styles.settingsItemLeft}>
                <Icon style={styles.settingsIcon} color={theme.colors.onSurfaceVariant} />
                <View>
                    <Text style={styles.settingsTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <ChevronRight style={styles.settingsChevron} color={theme.colors.onSurfaceVariant} />
        </View>
    );
    
    if (disabled) {
        return <View>{content}</View>;
    }
    
    return (
        <Link href={href as any} asChild>
            <Pressable style={({ pressed }) => [pressed && styles.pressed]}>{content}</Pressable>
        </Link>
    );
};

const BLUESKY_OFFICIAL_MOD_SERVICE = 'did:plc:z72i7hdynmk6r22z27h6tvur';

const ModerationSettingsScreen: React.FC = () => {
    const { isReady, adultContentEnabled, setAdultContentEnabled } = useModeration();

    return (
        <View>
            <ScreenHeader title="Moderation" />
            <View style={styles.container}>
                <View style={styles.section}>
                    <SettingsItem icon={Filter} title="Muted words & tags" href="/settings/muted-words" />
                    <SettingsItem icon={Users} title="Moderation lists" href="#" disabled />
                    <SettingsItem icon={MessageSquare} title="Muted accounts" href="#" disabled />
                    <SettingsItem icon={UserX} title="Blocked accounts" href="#" disabled />
                </View>
                
                <View>
                    <Text style={styles.sectionHeader}>Content filters</Text>
                    <View style={styles.toggleItem}>
                         <View>
                            <Text style={styles.settingsTitle}>Enable adult content</Text>
                        </View>
                        {isReady ? (
                             <ToggleSwitch checked={adultContentEnabled} onChange={setAdultContentEnabled} />
                        ) : (
                            <ActivityIndicator color={theme.colors.onSurfaceVariant} />
                        )}
                    </View>
                </View>

                 <View>
                    <Text style={styles.sectionHeader}>Advanced</Text>
                    <View style={styles.section}>
                        <Link href={`/settings/mod-service/${BLUESKY_OFFICIAL_MOD_SERVICE}` as any} asChild>
                            <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
                                 <View style={styles.settingsItemInner}>
                                    <View style={styles.settingsItemLeft}>
                                        <Shield style={styles.settingsIcon} color={theme.colors.primary} />
                                        <View>
                                            <Text style={styles.settingsTitle}>Bluesky Moderation Service</Text>
                                            <Text style={styles.settingsSubtitle}>Official Bluesky moderation service.</Text>
                                        </View>
                                    </View>
                                    <ChevronRight style={styles.settingsChevron} color={theme.colors.onSurfaceVariant} />
                                </View>
                            </Pressable>
                        </Link>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: theme.spacing.l,
        paddingHorizontal: theme.spacing.l,
        gap: theme.spacing.xl,
    },
    section: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.large,
        overflow: 'hidden',
    },
    settingsItemInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.l,
    },
    disabled: { opacity: 0.5 },
    pressed: { backgroundColor: theme.colors.surfaceContainerHigh },
    settingsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.l,
    },
    settingsIcon: { width: 24, height: 24 },
    settingsTitle: { ...theme.typography.bodyLarge, fontWeight: '600', color: theme.colors.onSurface },
    settingsSubtitle: { ...theme.typography.bodyMedium, color: theme.colors.onSurfaceVariant },
    settingsChevron: { width: 20, height: 20 },
    sectionHeader: {
        ...theme.typography.labelLarge,
        fontWeight: 'bold',
        color: theme.colors.onSurfaceVariant,
        paddingHorizontal: theme.spacing.s,
        marginBottom: theme.spacing.s,
    },
    toggleItem: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.large,
        padding: theme.spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});

export default ModerationSettingsScreen;
