import React, { useState, useEffect } from 'react';
import { useModeration } from '../../context/ModerationContext';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { AppBskyActorDefs } from '@atproto/api';
import { BadgeCheck } from 'lucide-react';
import { View, Text, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';
import ScreenHeader from '../layout/ScreenHeader';

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
        return <View style={styles.centered}><ActivityIndicator size="large" color="#A8C7FA" /></View>;
    }

    if (!serviceProfile) {
        return <View style={styles.centered}><Text style={styles.errorText}>Could not load moderation service details.</Text></View>;
    }

    return (
        <View>
            <ScreenHeader title={serviceProfile.displayName || ''} />
            <View style={styles.container}>
                <View style={styles.profileHeader}>
                    <Image source={{ uri: serviceProfile.avatar }} style={styles.avatar} />
                    <View>
                        <View style={styles.nameContainer}>
                            <Text style={styles.displayName}>{serviceProfile.displayName}</Text>
                            {serviceProfile.labels?.some(l => l.val === 'blue-check') && <BadgeCheck size={20} color="#A8C7FA" fill="currentColor" />}
                        </View>
                        <Text style={styles.handle}>@{serviceProfile.handle}</Text>
                    </View>
                </View>
                {serviceProfile.description && <Text style={styles.description}>{serviceProfile.description}</Text>}

                <View style={styles.labelsContainer}>
                    {configurableLabels.map(labelId => {
                        const def = blueskyLabelDefs[labelId];
                        const isDisabled = !isReady || (def.adult && !adultContentEnabled);
                        const currentVisibility = labelPreferences.get(def.id) || (def.adult ? 'warn' : 'show');
                        
                        return (
                            <View key={def.id} style={[styles.labelCard, isDisabled && styles.disabled]}>
                                <Text style={styles.labelTitle}>{def.title}</Text>
                                <Text style={styles.labelDescription}>{def.description}</Text>
                                {isDisabled && <Text style={styles.disabledText}>Configured in moderation settings.</Text>}

                                <View style={[styles.optionsContainer, isDisabled && { opacity: 0.5 }]}>
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
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    errorText: { color: '#F2B8B5', textAlign: 'center' },
    container: { padding: 16 },
    profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2b2d2e' },
    nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    displayName: { fontSize: 20, fontWeight: 'bold', color: '#E2E2E6' },
    handle: { color: '#C3C6CF', fontSize: 14 },
    description: { marginTop: 16, color: '#E2E2E6', fontSize: 14 },
    labelsContainer: { marginTop: 16, gap: 16 },
    labelCard: { backgroundColor: '#1E2021', borderRadius: 12, padding: 16 },
    disabled: { opacity: 0.5 },
    labelTitle: { fontWeight: '600', color: '#E2E2E6' },
    labelDescription: { fontSize: 14, color: '#C3C6CF' },
    disabledText: { fontSize: 12, color: '#FBBF24', marginTop: 4 },
    optionsContainer: { marginTop: 12, flexDirection: 'row', gap: 8 },
    optionButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#2b2d2e', alignItems: 'center' },
    optionButtonActive: { backgroundColor: '#A8C7FA' },
    optionText: { fontSize: 14, fontWeight: '600', color: '#E2E2E6' },
    optionTextActive: { color: '#003258' },
});

export default ModerationServiceScreen;
