
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAtp } from '../context/AtpContext';
import { useToast } from '../components/ui/use-toast';
import { useSavedFeeds } from './useSavedFeeds';
import { AppBskyFeedDefs, AtUri, AppBskyActorDefs } from '@atproto/api';

export const useFeedActions = (feedUri?: string) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { pinnedUris, addFeed, togglePin } = useSavedFeeds();

    const [feedView, setFeedView] = useState<AppBskyFeedDefs.GeneratorView | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        const fetchFeed = async () => {
            if (!feedUri) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const { data } = await agent.app.bsky.feed.getFeedGenerators({ feeds: [feedUri] });
                if (data.feeds.length > 0) {
                    setFeedView(data.feeds[0]);
                } else {
                    setError("Feed not found.");
                }
            } catch (err) {
                console.error("Failed to fetch feed generator:", err);
                setError("Could not load feed details.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeed();
    }, [agent, feedUri]);
    
    const likeUri = useMemo(() => feedView?.viewer?.like, [feedView]);
    const likeCount = useMemo(() => feedView?.likeCount || 0, [feedView]);
    const isPinned = useMemo(() => !!feedUri && pinnedUris.has(feedUri), [pinnedUris, feedUri]);
    
    const handleLike = useCallback(async () => {
        if (!feedView || isLiking || !session) return;
        setIsLiking(true);

        const originalLikeUri = likeUri;
        const originalLikeCount = likeCount;

        try {
            if (likeUri) {
                // Unlike
                setFeedView(prev => prev ? { ...prev, viewer: { ...prev.viewer, like: undefined }, likeCount: (prev.likeCount || 1) - 1 } : null);
                await agent.deleteLike(likeUri);
            } else {
                // Like
                setFeedView(prev => prev ? { ...prev, viewer: { ...prev.viewer, like: 'temp' }, likeCount: (prev.likeCount || 0) + 1 } : null);
                const { uri } = await agent.like(feedView.uri, feedView.cid);
                setFeedView(prev => prev ? { ...prev, viewer: { ...prev.viewer, like: uri } } : null);
            }
        } catch (error) {
            console.error("Failed to like/unlike feed:", error);
            toast({ title: "Action failed", description: "Could not update like status.", variant: "destructive" });
            // Revert UI on error
             setFeedView(prev => prev ? { ...prev, viewer: { ...prev.viewer, like: originalLikeUri }, likeCount: originalLikeCount } : null);
        } finally {
            setIsLiking(false);
        }
    }, [agent, feedView, isLiking, likeUri, likeCount, session, toast]);

    const handlePinToggle = useCallback(async () => {
        if (!feedView || !session) return;
        
        // If the feed is not yet saved, 'togglePin' should add and pin it.
        const { data: { preferences } } = await agent.app.bsky.actor.getPreferences();
        const currentItems = preferences
            .find(p => p.$type === 'app.bsky.actor.defs#savedFeedsPref') as AppBskyActorDefs.SavedFeedsPref | undefined;
        const isSaved = currentItems?.items.some(item => item.value === feedView.uri);
        
        if (!isSaved) {
            await addFeed(feedView, true);
            toast({ title: "Feed Pinned" });
        } else {
            await togglePin(feedView.uri);
            toast({ title: isPinned ? "Feed Unpinned" : "Feed Pinned" });
        }
    }, [agent, feedView, session, addFeed, togglePin, isPinned, toast]);
    
    const handleShare = async () => {
        if (!feedView) return;
        const feedUrl = `${window.location.origin}/#/profile/${feedView.creator.handle}/feed/${new AtUri(feedView.uri).rkey}`;
        try {
            await navigator.clipboard.writeText(feedUrl);
            toast({ title: "Link Copied!" });
        } catch (err) {
            console.error('Failed to copy link:', err);
            toast({ title: "Error", description: "Could not copy link to clipboard.", variant: "destructive"});
        }
    };

    return {
        feedView,
        isLoading,
        error,
        likeUri,
        likeCount,
        isLiking,
        handleLike,
        isPinned,
        handlePinToggle,
        handleShare
    };
};
