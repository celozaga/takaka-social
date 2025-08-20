
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyActorDefs } from '@atproto/api';
import ActorSearchResultCard from '../search/ActorSearchResultCard';
import { Search } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const ActorSkeletonCard: React.FC = () => (
    <View style={styles.skeletonContainer}>
        <View style={styles.skeletonContent}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonMain}>
                <View style={styles.skeletonHeader}>
                    <View style={styles.skeletonHeaderText}>
                        <View style={[styles.skeletonLine, { width: 128, height: 16 }]} />
                        <View style={[styles.skeletonLine, { width: 96, height: 12 }]} />
                    </View>
                    <View style={styles.skeletonButton} />
                </View>
                <View style={[styles.skeletonLine, { marginTop: 12, width: '83.33%' }]} />
            </View>
        </View>
    </View>
);

const SuggestedFollows: React.FC = () => {
    const { agent, session } = useAtp();
    const [profiles, setProfiles] = useState<(AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed)[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!session) {
            setIsLoading(false);
            return;
        }

        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const { data } = await agent.app.bsky.actor.getSuggestions({ limit: 15 });
                setProfiles(data.actors);
            } catch (error) {
                console.error(`Failed to fetch suggestions:`, error);
                // Fail silently
                setProfiles([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, [agent, session]);

    if (!session || (!isLoading && profiles.length === 0)) {
        return null;
    }

    return (
        <View>
             <View style={styles.header}>
                <Text style={styles.title}>Suggested Follows</Text>
                <Link href="/(tabs)/search?filter=people" asChild>
                    <Pressable style={styles.searchButton}>
                        <Search size={20} color="#C3C6CF" />
                    </Pressable>
                </Link>
            </View>

            <View style={styles.listContainer}>
                {isLoading ? (
                    [...Array(5)].map((_, i) => <ActorSkeletonCard key={i} />)
                ) : (
                    profiles.map(profile => (
                        <ActorSearchResultCard key={profile.did} actor={profile} />
                    ))
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E2E2E6'
    },
    searchButton: {
        padding: 4,
    },
    listContainer: {
        gap: 12,
    },
    skeletonContainer: {
        padding: 16,
        backgroundColor: '#1E2021', // surface-2
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2b2d2e', // surface-3
    },
    skeletonContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    skeletonAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#2b2d2e',
        flexShrink: 0,
    },
    skeletonMain: {
        flex: 1,
        minWidth: 0,
    },
    skeletonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skeletonHeaderText: {
        minWidth: 0,
        gap: 8,
    },
    skeletonLine: {
        height: 12,
        backgroundColor: '#2b2d2e',
        borderRadius: 4,
    },
    skeletonButton: {
        height: 32,
        width: 96,
        backgroundColor: '#2b2d2e',
        borderRadius: 999,
        marginLeft: 8,
    }
});

export default SuggestedFollows;
