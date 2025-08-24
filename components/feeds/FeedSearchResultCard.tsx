
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import {AppBskyFeedDefs } from '@atproto/api';
import FeedAvatar from './FeedAvatar';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { theme } from '@/lib/theme';

interface FeedSearchResultCardProps {
  feed:AppBskyFeedDefs.GeneratorView;
  isPinned: boolean;
  onTogglePin: () => void;
}

const FeedSearchResultCard: React.FC<FeedSearchResultCardProps> = ({ feed, isPinned, onTogglePin }) => {
    const { session } = useAtp();
    const { t } = useTranslation();
    const feedLink = `/profile/${feed.creator.handle}/feed/${feed.uri.split('/').pop()}`;

    const handleTogglePin = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        onTogglePin();
    };
    
    const content = (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <FeedAvatar src={feed.avatar} alt={feed.displayName} style={styles.avatar} />
                <View style={styles.mainContent}>
                    <View style={styles.header}>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.title} numberOfLines={1}>{feed.displayName}</Text>
                            <Text style={styles.byline}>{t('feeds.byline', { handle: feed.creator.handle })}</Text>
                        </View>
                        {session && (
                             <Pressable 
                                onPress={handleTogglePin}
                                style={[styles.pinButton, isPinned ? styles.unpinButton : styles.pinButtonActive]}
                            >
                                <Text style={[styles.pinButtonText, isPinned ? styles.unpinButtonText : styles.pinButtonTextActive]}>
                                    {isPinned ? t('feeds.unpinAction') : t('feeds.pinAction')}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                    {feed.description && <Text style={styles.description} numberOfLines={2}>{feed.description.replace(/\n/g, ' ')}</Text>}
                </View>
            </View>
        </View>
    );

    return (
        <Link href={feedLink as any} asChild>
            <Pressable>{content}</Pressable>
        </Link>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.l,
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.large,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.m,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: theme.shape.large,
        flexShrink: 0,
    },
    mainContent: {
        flex: 1,
        minWidth: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTextContainer: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        ...theme.typography.titleSmall,
        color: theme.colors.onSurface,
    },
    byline: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurfaceVariant,
    },
    pinButton: {
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.l,
        borderRadius: theme.shape.full,
        flexShrink: 0,
    },
    unpinButton: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    pinButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    pinButtonText: {
        ...theme.typography.labelLarge,
        fontWeight: '600',
    },
    unpinButtonText: {
        color: theme.colors.onSurface,
    },
    pinButtonTextActive: {
        color: theme.colors.onPrimary,
    },
    description: {
        ...theme.typography.bodyMedium,
        marginTop: theme.spacing.xs,
        color: theme.colors.onSurface,
        lineHeight: 20
    },
});


export default React.memo(FeedSearchResultCard);