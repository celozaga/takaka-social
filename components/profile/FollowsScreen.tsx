


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { AppBskyActorDefs, AppBskyGraphGetFollowers, AppBskyGraphGetFollows } from '@atproto/api';
import ActorSearchResultCard from '../search/ActorSearchResultCard';
import ScreenHeader from '../layout/ScreenHeader';
import { useHeadManager } from '../../hooks/useHeadManager';

interface FollowsScreenProps {
    actor: string;
    type: 'followers' | 'following';
}

const FollowsScreen: React.FC<FollowsScreenProps> = ({ actor, type }) => {
    const { agent } = useAtp();
    const { t } = useTranslation();
    const { setCustomFeedHeaderVisible } = useUI();
    const [list, setList] = useState<AppBskyActorDefs.ProfileView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef<HTMLDivElement>(null);

    const title = t(`common.${type}`);
    useHeadManager({ title });

    useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const fetchList = useCallback(async (currentCursor?: string) => {
        const fetchFn = type === 'followers'
            ? agent.getFollowers({ actor, cursor: currentCursor, limit: 50 })
            : agent.getFollows({ actor, cursor: currentCursor, limit: 50 });
        
        return fetchFn;
    }, [agent, actor, type]);

    useEffect(() => {
        const loadInitial = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data } = await fetchList();
                setList(type === 'followers' 
                    ? (data as AppBskyGraphGetFollowers.OutputSchema).followers 
                    : (data as AppBskyGraphGetFollows.OutputSchema).follows
                );
                setCursor(data.cursor);
                setHasMore(!!data.cursor);
            } catch (err: any) {
                console.error(`Failed to fetch ${type}:`, err);
                setError(t('follows.loadingError', { type }));
            } finally {
                setIsLoading(false);
            }
        };
        loadInitial();
    }, [fetchList, type, t]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !cursor || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const { data } = await fetchList(cursor);
            const newList = type === 'followers' 
                ? (data as AppBskyGraphGetFollowers.OutputSchema).followers 
                : (data as AppBskyGraphGetFollows.OutputSchema).follows;
            if (newList.length > 0) {
                setList(prev => [...prev, ...newList]);
                setCursor(data.cursor);
                setHasMore(!!data.cursor);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Failed to load more:', err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [cursor, hasMore, isLoadingMore, fetchList, type]);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
                    loadMore();
                }
            }, { rootMargin: '400px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => { if (currentLoader) observer.unobserve(currentLoader); };
    }, [hasMore, isLoading, isLoadingMore, loadMore]);
    
    return (
        <div>
            <ScreenHeader title={title} />
            <div className="mt-4 space-y-3">
                {isLoading && (
                    [...Array(8)].map((_, i) => (
                         <div key={i} className="bg-surface-2 rounded-xl p-3 h-[88px] animate-pulse"></div>
                    ))
                )}
                {!isLoading && error && (
                    <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error}</div>
                )}
                {!isLoading && !error && list.length === 0 && (
                    <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">{t('follows.empty')}</div>
                )}
                {list.map(user => (
                    <ActorSearchResultCard key={user.did} actor={user} />
                ))}
                <div ref={loaderRef} className="h-10">
                    {isLoadingMore && <div className="bg-surface-2 rounded-xl p-3 h-[88px] animate-pulse mt-4"></div>}
                </div>
            </div>
        </div>
    );
};
export default FollowsScreen;
