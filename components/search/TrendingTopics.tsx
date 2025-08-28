import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { TrendingUp } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '@/components/shared';

const TrendingTopics: React.FC = () => {
    const { theme } = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
    const { agent } = useAtp();
    const [trends, setTrends] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            setIsLoading(true);
            try {
                const { data } = await (agent.api.app.bsky.unspecced as any).getTrendingHashtags({ limit: 10 });
                if (data.hashtags) {
                    setTrends(data.hashtags.map((h: any) => h.tag));
                }
            } catch (error) {
                console.error("Failed to fetch trending topics:", error);
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
                    <TrendingUp size={24} color={theme.colors.primary} />
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
        return null;
    }

    return (
        <View>
            <View style={styles.header}>
                <TrendingUp size={24} color={theme.colors.primary} />
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

const createStyles = (theme: any) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
        marginBottom: theme.spacing.m,
        paddingHorizontal: theme.spacing.xs,
    },
    title: {
        ...theme.typography.titleLarge,
        color: theme.colors.onSurface
    },
    skeletonContainer: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.l,
        gap: theme.spacing.l,
    },
    skeletonItem: {
        height: 20,
        width: '75%',
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.radius.sm,
    },
    listContainer: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
    },
    listItem: {
        padding: theme.spacing.m,
    },
    listItemBorder: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.surfaceContainerHigh,
    },
    listItemPressed: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    tagText: {
        ...theme.typography.bodyLarge,
        fontWeight: '600',
        color: theme.colors.onSurface
    }
});

export default TrendingTopics;
