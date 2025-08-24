


import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useSavedFeeds } from '../../hooks/useSavedFeeds';
import { AppBskyFeedDefs } from '@atproto/api';
import { Search } from 'lucide-react';
import FeedSearchResultCard from './FeedSearchResultCard';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';


interface PopularFeedsProps {
  showHeader?: boolean;
}

const PopularFeeds: React.FC<PopularFeedsProps> = ({ showHeader = true }) => {
    const { agent } = useAtp();
    const [feeds, setFeeds] = useState<AppBskyFeedDefs.GeneratorView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { pinnedUris, togglePin, addFeed } = useSavedFeeds();
    
    useEffect(() => {
        const fetchFeeds = async () => {
            setIsLoading(true);
            try {
                // This is an unspecced API but widely used by clients.
                const response = await (agent.api.app.bsky.unspecced as any).getPopularFeedGenerators({ limit: 15 });
                setFeeds(response.data.feeds);
            } catch (error) {
                console.error("Failed to fetch popular feeds:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeeds();
    }, [agent]);

    const handlePinToggle = (feed: AppBskyFeedDefs.GeneratorView) => {
        const isPinned = pinnedUris.has(feed.uri);
        if (isPinned) {
            togglePin(feed.uri); // This will just unpin
        } else {
            addFeed(feed, true); // This will save and pin
        }
    }
    
    return (
        <View>
            {showHeader && (
                <View style={styles.header}>
                    <Text style={styles.title}>Popular Feeds</Text>
                    <Link href="/feeds" asChild>
                        <Pressable style={styles.searchButton}>
                            <Search size={20} color="#C3C6CF" />
                        </Pressable>
                    </Link>
                </View>
            )}
             {isLoading ? (
                <View style={styles.skeletonContainer}>
                    {[...Array(3)].map((_, i) => (
                        <View key={i} style={styles.skeletonItem} />
                    ))}
                </View>
             ) : (
                <View style={styles.listContainer}>
                    {feeds.map(feed => (
                        <FeedSearchResultCard
                            key={feed.uri} 
                            feed={feed}
                            isPinned={pinnedUris.has(feed.uri)}
                            onTogglePin={() => handlePinToggle(feed)}
                        />
                    ))}
                </View>
             )}
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
        color: '#E2E2E6',
    },
    searchButton: {
        padding: 4,
    },
    skeletonContainer: {
        gap: 12,
    },
    skeletonItem: {
        backgroundColor: '#1E2021', // surface-2
        borderRadius: 12,
        padding: 12,
        height: 88,
        opacity: 0.5,
    },
    listContainer: {
        gap: 12,
    },
});

export default PopularFeeds;