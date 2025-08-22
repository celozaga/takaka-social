import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyActorDefs } from '@atproto/api';
import ActorSearchResultCard from '../search/ActorSearchResultCard';
import { Search } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { theme } from '@/lib/theme';

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
                <View style={[styles.skeletonLine, { marginTop: theme.spacing.m, width: '83.33%' }]} />
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
                <Link href="/search?filter=people" asChild>
                    <Pressable style={styles.searchButton}>
                        <Search size={20} color={theme.colors.onSurfaceVariant} />
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
        marginBottom: theme.spacing.m,
        paddingHorizontal: theme.spacing.xs,
    },
    title: {
        ...theme.typography.titleLarge,
        color: theme.colors.onSurface
    },
    searchButton: {
        padding: theme.spacing.xs,
    },
    listContainer: {
        gap: theme.spacing.m,
    },
    skeletonContainer: {
        padding: theme.spacing.l,
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.large,
        borderWidth: 0,
    },
    skeletonContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.l,
    },
    skeletonAvatar: {
        width: 48,
        height: 48,
        borderRadius: theme.shape.full,
        backgroundColor: theme.colors.surfaceContainerHigh,
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
        gap: theme.spacing.s,
    },
    skeletonLine: {
        height: 12,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.small,
    },
    skeletonButton: {
        height: 32,
        width: 96,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.full,
        marginLeft: theme.spacing.s,
    }
});

export default SuggestedFollows;
