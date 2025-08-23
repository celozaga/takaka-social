import React, { useState, useEffect } from 'react';
import { useModeration } from '../../context/ModerationContext';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { AppBskyActorDefs } from '@atproto/api';
import { BadgeCheck } from 'lucide-react';
import { View, Text, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenHeader from '../layout/ScreenHeader';
import { theme } from '@/lib/theme';

interface ModerationServiceScreenProps {
  serviceDid: string;
}

const blueskyLabelDefs = {
  'porn': { id: 'porn', title: 'Adult Content', description: 'Explicit sexual images.', adult: true, },
  'sexual': { id: 'sexual', title: 'Sexually Suggestive', description: 'Does not include nudity.', adult: true, },
  'nudity': { id: 'nudity', title: 'Non-sexual Nudity', description: 'e.g. artistic nudes.', adult: true, },
  'graphic-media': { id: 'graphic-media', title: 'Graphic Media', description: 'Explicit or potentially disturbing media.', adult: false, }
};
type LabelId = keyof typeof blueskyLabelDefs;
const configurableLabels = ['porn', 'sexual', 'nudity', 'graphic-media'] as LabelId[];
type LabelVisibility = 'show' | 'warn' | 'hide';


const ModerationServiceScreen: React.FC<ModerationServiceScreenProps> = ({ serviceDid }) => {
    const { getProfile } = useProfileCache();
    const { isReady, adultContentEnabled, labelPreferences, setLabelPreference } = useModeration();
    const [serviceProfile, setServiceProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const data = await getProfile(serviceDid);
                setServiceProfile(data);
            } catch (e) { console.error("Failed to fetch mod service profile", e); }
            finally { setIsLoading(false); }
        };
        fetchProfile();
    }, [getProfile, serviceDid]);
    
    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
    }

    if (!serviceProfile) {
        return <View style={styles.centered}><Text style={styles.errorText}>Could not load moderation service details.</Text></View>;
    }

    return (
        <View>
            <ScreenHeader title={serviceProfile.displayName || ''} />
            <View style={theme.settingsStyles.scrollContainer}>
                <View style={styles.profileHeader}>
                    <Image source={{ uri: serviceProfile.avatar }} style={styles.avatar} />
                    <View>
                        <View style={styles.nameContainer}>
                            <Text style={styles.displayName}>{serviceProfile.displayName}</Text>
                            {serviceProfile.labels?.some(l => l.val === 'blue-check') && <BadgeCheck size={20} color={theme.colors.primary} fill="currentColor" />}
                        </View>
                        <Text style={styles.handle}>@{serviceProfile.handle}</Text>
                    </View>
                </View>
                {serviceProfile.description && <Text style={[theme.settingsStyles.description, {marginBottom: 0, marginTop: theme.spacing.l}]}>{serviceProfile.description}</Text>}

                <View style={styles.labelsContainer}>
                    {configurableLabels.map(labelId => {
                        const def = blueskyLabelDefs[labelId];
                        const isDisabled = !isReady || (def.adult && !adultContentEnabled);
                        const currentVisibility = labelPreferences.get(def.id) || (def.adult ? 'warn' : 'show');
                        
                        return (
                            <View key={def.id} style={[styles.labelCard, isDisabled && theme.settingsStyles.disabled]}>
                                <Text style={styles.labelTitle}>{def.title}</Text>
                                <Text style={theme.settingsStyles.sublabel}>{def.description}</Text>
                                {isDisabled && <Text style={styles.disabledText}>Configured in moderation settings.</Text>}

                                <View style={styles.optionsContainer}>
                                    {(['Hide', 'Warn', 'Show'] as const).map(option => {
                                        const value = option.toLowerCase() as LabelVisibility;
                                        const isActive = currentVisibility === value;
                                        return (
                                            <Pressable 
                                                key={option}
                                                onPress={() => setLabelPreference(def.id, value)}
                                                disabled={isDisabled}
                                                style={[styles.optionButton, isActive && styles.optionButtonActive]}
                                            >
                                                <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{option}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xxl },
    errorText: { color: theme.colors.error, textAlign: 'center' },
    profileHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.l },
    avatar: { width: 64, height: 64, borderRadius: theme.shape.full, backgroundColor: theme.colors.surfaceContainerHigh },
    nameContainer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
    displayName: { ...theme.typography.titleLarge, color: theme.colors.onSurface },
    handle: { ...theme.typography.bodyMedium, color: theme.colors.onSurfaceVariant },
    labelsContainer: { marginTop: theme.spacing.xl, gap: theme.spacing.l },
    labelCard: { backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shape.large, padding: theme.spacing.l },
    labelTitle: { ...theme.typography.labelLarge, fontWeight: '600', color: theme.colors.onSurface },
    disabledText: { ...theme.typography.bodySmall, color: theme.colors.error, marginTop: theme.spacing.xs },
    optionsContainer: { marginTop: theme.spacing.m, flexDirection: 'row', gap: theme.spacing.s },
    optionButton: { flex: 1, paddingVertical: theme.spacing.s, paddingHorizontal: theme.spacing.m, borderRadius: theme.shape.medium, backgroundColor: theme.colors.surfaceContainerHigh, alignItems: 'center' },
    optionButtonActive: { backgroundColor: theme.colors.primary },
    optionText: { ...theme.typography.labelLarge, fontWeight: '600', color: theme.colors.onSurface },
    optionTextActive: { color: theme.colors.onPrimary },
});

export default ModerationServiceScreen;
