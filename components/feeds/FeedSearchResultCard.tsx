import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import {AppBskyFeedDefs } from '@atproto/api';
import FeedAvatar from './FeedAvatar';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

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
        padding: 16,
        backgroundColor: '#1E2021', // surface-2
        borderRadius: 12,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
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
        fontWeight: 'bold',
        color: '#E2E2E6',
    },
    byline: {
        fontSize: 14,
        color: '#C3C6CF',
    },
    pinButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 999,
        flexShrink: 0,
    },
    unpinButton: {
        backgroundColor: '#2b2d2e', // surface-3
    },
    pinButtonActive: {
        backgroundColor: '#A8C7FA', // primary
    },
    pinButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    unpinButtonText: {
        color: '#E2E2E6', // on-surface
    },
    pinButtonTextActive: {
        color: '#003258', // on-primary
    },
    description: {
        fontSize: 14,
        marginTop: 4,
        color: '#E2E2E6',
        lineHeight: 20
    },
});


export default React.memo(FeedSearchResultCard);