
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { TrendingUp } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const TrendingTopics: React.FC = () => {
    const { agent } = useAtp();
    const [trends, setTrends] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            setIsLoading(true);
            try {
                // The `getTrendingHashtags` method is on the unspecced API namespace.
                const { data } = await (agent.api.app.bsky.unspecced as any).getTrendingHashtags({ limit: 10 });
                if (data.hashtags) {
                    setTrends(data.hashtags.map(h => h.tag));
                }
            } catch (error) {
                console.error("Failed to fetch trending topics:", error);
                // Silently fail, don't show an error to the user
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrends();
    }, [agent]);

    if (isLoading) {
        return (
            <View>
                <View style={styles.header}>
                    <TrendingUp size={24} color="#A8C7FA" />
                    <Text style={styles.title}>Trending</Text>
                </View>
                <View style={styles.skeletonContainer}>
                    {[...Array(5)].map((_, i) => (
                        <View key={i} style={styles.skeletonItem} />
                    ))}
                </View>
            </View>
        );
    }
    
    if (trends.length === 0) {
        return null; // Don't render if there are no trends or if the fetch failed
    }

    return (
        <View>
            <View style={styles.header}>
                <TrendingUp size={24} color="#A8C7FA" />
                <Text style={styles.title}>Trending</Text>
            </View>
            <View style={styles.listContainer}>
                {trends.map((tag, index) => (
                    <Link 
                        key={tag} 
                        href={`/search?q=${encodeURIComponent('#' + tag)}&filter=top` as any} 
                        asChild
                    >
                        <Pressable style={({ pressed }) => [styles.listItem, index > 0 && styles.listItemBorder, pressed && styles.listItemPressed]}>
                            <Text style={styles.tagText}>#{tag}</Text>
                        </Pressable>
                    </Link>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#E2E2E6'
    },
    skeletonContainer: {
        backgroundColor: '#1E2021', // surface-2
        borderRadius: 12,
        padding: 16,
        gap: 16,
    },
    skeletonItem: {
        height: 20,
        width: '75%',
        backgroundColor: '#2b2d2e', // surface-3
        borderRadius: 4,
    },
    listContainer: {
        backgroundColor: '#1E2021',
        borderRadius: 12,
        overflow: 'hidden',
    },
    listItem: {
        padding: 12,
    },
    listItemBorder: {
        borderTopWidth: 1,
        borderTopColor: '#2b2d2e', // surface-3
    },
    listItemPressed: {
        backgroundColor: '#2b2d2e',
    },
    tagText: {
        fontWeight: '600',
        color: '#E2E2E6'
    }
});

export default TrendingTopics;