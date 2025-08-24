

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../context/AtpContext';
import { useToast } from '../components/ui/use-toast';
import { useSavedFeeds } from './useSavedFeeds';
import {AppBskyFeedDefs} from '@atproto/api';
import { WEB_CLIENT_URL } from '../lib/config';
import * as Clipboard from 'expo-clipboard';

export const useFeedActions = (feedUri?: string) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { t } = useTranslation();
    const { pinnedUris, togglePin, addFeed } = useSavedFeeds();

    const [feedView, setFeedView] = useState<AppBskyFeedDefs.GeneratorView | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLiking, setIsLiking] = useState(false);
    
    // Optimistic state for likes
    const [likeUri, setLikeUri] = useState<string | undefined>(undefined);
    const [likeCount, setLikeCount] = useState(0);

    const isPinned = useMemo(() => !!feedUri && pinnedUris.has(feedUri), [pinnedUris, feedUri]);

    useEffect(() => {
        const fetchFeed = async () => {
            if (!feedUri) {
                setFeedView(null);
                setIsLoading(false);
                return;
            };
            setIsLoading(true);
            setError(null);
            try {
                const { data } = await agent.app.bsky.feed.getFeedGenerator({ feed: feedUri });
                setFeedView(data.view);
                setLikeUri(data.view.viewer?.like);
                setLikeCount(data.view.likeCount || 0);
            } catch (err: any) {
                console.error("Failed to fetch feed generator:", err);
                setError(err.message || t('feedModal.loadingError'));
            } finally {
                setIsLoading(false);
            }
        }
        fetchFeed();
    }, [agent, feedUri, t]);

    const handleLike = async () => {
        if (!feedView || isLiking || !session) return;
        setIsLiking(true);

        const originalLikeUri = likeUri;
        const originalLikeCount = likeCount;

        try {
            if (likeUri) { // Currently liked, so unlike
                setLikeUri(undefined);
                setLikeCount(c => Math.max(0, c - 1));
                await agent.deleteLike(likeUri);
            } else { // Not liked, so like
                setLikeUri('temp:like');
                setLikeCount(c => c + 1);
                const { uri: newLikeUri } = await agent.like(feedView.uri, feedView.cid);
                setLikeUri(newLikeUri);
                // Refetch to get accurate like count
                const { data } = await agent.app.bsky.feed.getFeedGenerator({ feed: feedView.uri });
                setLikeCount(data.view.likeCount || 0);
            }
        } catch (err: any) {
            console.error("Failed to like/unlike feed:", err);
            if (err && err.status === 429) {
                toast({ title: t('common.rateLimitTitle'), description: t('common.rateLimitError'), variant: "destructive" });
            } else {
                toast({ title: t('common.error'), description: t('hooks.actionFailed'), variant: "destructive" });
            }
            setLikeUri(originalLikeUri);
            setLikeCount(originalLikeCount);
        } finally {
            setIsLiking(false);
        }
    };

    const handlePinToggle = () => {
        if (!feedView) return;
        if (isPinned) {
            togglePin(feedView.uri);
        } else {
            addFeed(feedView, true);
        }
    };

    const handleShare = async () => {
        if (!feedView) return;
        const handle = feedView.creator.handle;
        const rkey = new URL(feedView.uri).pathname.split('/').pop();
        const url = `${WEB_CLIENT_URL}/profile/${handle}/feed/${rkey}`;
        await Clipboard.setStringAsync(url);
        toast({ title: t('post.linkCopied'), description: t('post.linkCopiedDescription') });
    };

    return {
        feedView,
        isLoading,
        error,
        isLiking,
        likeUri,
        likeCount,
        handleLike,
        isPinned,
        handlePinToggle,
        handleShare
    };
};