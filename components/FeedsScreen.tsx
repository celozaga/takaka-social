
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSavedFeeds } from '../hooks/useSavedFeeds';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';
import { Search } from 'lucide-react';
import PopularFeeds from './PopularFeeds';
import FeedSearchResultCard from './FeedSearchResultCard';

const FeedsScreen: React.FC = () => {
    const { session, agent } = useAtp();
    const { isLoading: isLoadingSavedFeeds, pinnedUris, allUris, feedViews, addFeed, togglePin } = useSavedFeeds();

    // State for search
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AppBskyFeedDefs.GeneratorView[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const loaderRef = useRef<HTMLDivElement>(null);

    const fetchSearchResults = useCallback(async (searchQuery: string, currentCursor?: string) => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const isInitialSearch = !currentCursor;
        if (isInitialSearch) {
            setIsSearching(true);
            setSearchResults([]);
            setCursor(undefined);
            setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const response = await (agent.api.app.bsky.unspecced as any).getPopularFeedGenerators({
                query: searchQuery,
                limit: 25,
                cursor: currentCursor
            });
            setSearchResults(prev => isInitialSearch ? response.data.feeds : [...prev, ...response.data.feeds]);
            setCursor(response.data.cursor);
            setHasMore(!!response.data.cursor);
        } catch (error) {
            console.error("Feed search failed:", error);
        } finally {
            if (isInitialSearch) setIsSearching(false);
            else setIsLoadingMore(false);
        }
    }, [agent]);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasMore && !isSearching && !isLoadingMore && query.trim()) {
              fetchSearchResults(query, cursor);
            }
          },
          { rootMargin: '400px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => {
          if (currentLoader) observer.unobserve(currentLoader);
        };
    }, [hasMore, isSearching, isLoadingMore, fetchSearchResults, query, cursor]);


    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSearchResults(query);
    };

    const handlePinToggle = (feed: AppBskyFeedDefs.GeneratorView) => {
        const isPinned = pinnedUris.has(feed.uri);
        if (isPinned) {
            togglePin(feed.uri);
        } else {
            addFeed(feed, true);
        }
    };
    
    const savedFeedUris = allUris.filter(uri => !pinnedUris.has(uri));
    const pinnedFeedItems = [...pinnedUris].map(uri => feedViews.get(uri)).filter(Boolean) as AppBskyFeedDefs.GeneratorView[];
    const savedFeedItems = savedFeedUris.map(uri => feedViews.get(uri)).filter(Boolean) as AppBskyFeedDefs.GeneratorView[];


    if (!session) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-6">Discover Feeds</h1>
                <PopularFeeds showHeader={false} />
            </div>
        );
    }
    
    const showDiscovery = !query.trim();

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Feeds</h1>
            <form onSubmit={handleFormSubmit} className="flex gap-2 mb-6">
                 <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for new feeds"
                        className="w-full pl-12 pr-4 py-3 bg-surface-3 border-b-2 border-surface-3 rounded-t-lg focus:ring-0 focus:border-primary focus:bg-surface-3 outline-none transition duration-200"
                    />
                </div>
            </form>

            {showDiscovery ? (
                 <div className="space-y-8">
                    <PopularFeeds showHeader={false} />
                    
                    {isLoadingSavedFeeds ? (
                         <div className="bg-surface-2 rounded-xl h-24 animate-pulse"></div>
                    ) : (
                        (pinnedFeedItems.length > 0 || savedFeedItems.length > 0) && (
                            <div>
                                <h2 className="text-lg font-bold mb-2">My Feeds</h2>
                                <div className="space-y-3">
                                    {pinnedFeedItems.map(feed => (
                                        <FeedSearchResultCard key={feed.uri} feed={feed} isPinned={true} onTogglePin={() => togglePin(feed.uri)} />
                                    ))}
                                    {savedFeedItems.map(feed => (
                                        <FeedSearchResultCard key={feed.uri} feed={feed} isPinned={false} onTogglePin={() => togglePin(feed.uri)} />
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                 </div>
            ) : (
                // Search Results View
                <div>
                     {isSearching ? (
                        <div className="space-y-3">
                           {[...Array(5)].map((_, i) => <div key={i} className="bg-surface-2 rounded-xl p-3 h-[88px] animate-pulse"></div>)}
                        </div>
                     ) : searchResults.length > 0 ? (
                         <div className="space-y-3">
                            {searchResults.map(feed => (
                                <FeedSearchResultCard
                                    key={feed.uri} 
                                    feed={feed}
                                    isPinned={pinnedUris.has(feed.uri)}
                                    onTogglePin={() => handlePinToggle(feed)}
                                />
                            ))}
                        </div>
                     ) : (
                        <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">No feeds found for "{query}".</div>
                     )}

                    <div ref={loaderRef} className="h-10">
                        {isLoadingMore && <div className="bg-surface-2 rounded-xl p-3 h-[88px] animate-pulse mt-3"></div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedsScreen;
