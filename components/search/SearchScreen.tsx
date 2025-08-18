
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyActorDefs, AppBskyEmbedImages, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from '../post/PostCard';
import { Search, UserCircle, Image as ImageIcon, Video, TrendingUp, Clock, List } from 'lucide-react';
import PostCardSkeleton from '../post/PostCardSkeleton';
import ActorSearchResultCard from './ActorSearchResultCard';
import PopularFeeds from '../feeds/PopularFeeds';
import SuggestedFollows from '../profile/SuggestedFollows';
import { useSavedFeeds } from '../../hooks/useSavedFeeds';
import FeedSearchResultCard from '../feeds/FeedSearchResultCard';
import { useUI } from '../../context/UIContext';
import SearchHeader from './SearchHeader';

type SearchResult = AppBskyFeedDefs.PostView | AppBskyActorDefs.ProfileView | AppBskyFeedDefs.GeneratorView;
type FilterType = 'top' | 'latest' | 'images' | 'videos' | 'people' | 'feeds';

interface SearchScreenProps {
  initialQuery?: string;
  initialFilter?: string;
}

const filters: { id: FilterType; label: string; icon: React.FC<any> }[] = [
    { id: 'top', label: 'Top', icon: TrendingUp },
    { id: 'latest', label: 'Latest', icon: Clock },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'people', label: 'People', icon: UserCircle },
    { id: 'feeds', label: 'Feeds', icon: List },
];

const SearchScreen: React.FC<SearchScreenProps> = ({ initialQuery = '', initialFilter = 'top' }) => {
    const { agent } = useAtp();
    const { setCustomFeedHeaderVisible } = useUI();
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const { pinnedUris, togglePin, addFeed } = useSavedFeeds();
    
    const loaderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    // Derive activeFilter directly from props, making the URL the single source of truth.
    const activeFilter = (initialFilter as FilterType) || 'top';
    
    const showDiscoveryContent = !initialQuery.trim();
    const supportsInfiniteScroll = activeFilter !== 'people';
    const isListView = activeFilter === 'people' || activeFilter === 'feeds';


    const fetchResults = useCallback(async (searchQuery: string, searchFilter: FilterType, currentCursor?: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        if (!currentCursor) {
            setIsLoading(true);
            setResults([]);
            setCursor(undefined);
            setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }
        
        try {
            if (searchFilter === 'people') {
                const response = await agent.app.bsky.actor.searchActors({ term: searchQuery, limit: 30, cursor: currentCursor });
                setResults(prev => currentCursor ? [...prev, ...response.data.actors] : response.data.actors);
                setCursor(response.data.cursor);
                setHasMore(!!response.data.cursor);
            } else if (searchFilter === 'feeds') {
                const response = await (agent.api.app.bsky.unspecced as any).getPopularFeedGenerators({
                    query: searchQuery,
                    limit: 25,
                    cursor: currentCursor
                });
                setResults(prev => currentCursor ? [...prev, ...response.data.feeds] : response.data.feeds);
                setCursor(response.data.cursor);
                setHasMore(!!response.data.cursor);
            } else { // All other filters are post searches
                let allFetchedPosts: AppBskyFeedDefs.PostView[] = [];
                let nextCursor: string | undefined = currentCursor;
                let attempts = 0;

                while (attempts < 5) {
                    attempts++;
                    const response = await agent.app.bsky.feed.searchPosts({ 
                        q: searchQuery, 
                        limit: 50,
                        cursor: nextCursor,
                        sort: searchFilter === 'latest' ? 'latest' : 'top',
                    });
                    
                    allFetchedPosts = [...allFetchedPosts, ...response.data.posts];
                    nextCursor = response.data.cursor;

                    if (searchFilter === 'images' || searchFilter === 'videos') {
                        const mediaPosts = allFetchedPosts.filter(post => {
                            const embed = post.embed;
                            if (!embed) return false;

                            if (searchFilter === 'images') {
                                if (AppBskyEmbedImages.isView(embed)) return true;
                                if (AppBskyEmbedRecordWithMedia.isView(embed)) {
                                    return AppBskyEmbedImages.isView(embed.media);
                                }
                            } else if (searchFilter === 'videos') {
                                if (AppBskyEmbedVideo.isView(embed)) return true;
                                if (AppBskyEmbedRecordWithMedia.isView(embed)) {
                                    return AppBskyEmbedVideo.isView(embed.media);
                                }
                            }
                            return false;
                        });
                        
                        if (mediaPosts.length >= 10 || !nextCursor) {
                            allFetchedPosts = mediaPosts;
                            break;
                        }
                    } else {
                        break;
                    }
                }
                
                setResults(prev => currentCursor ? [...prev, ...allFetchedPosts] : allFetchedPosts);
                setCursor(nextCursor);
                setHasMore(!!nextCursor && allFetchedPosts.length > 0);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [agent]);
    
    useEffect(() => {
        if (!showDiscoveryContent) {
            fetchResults(initialQuery, activeFilter);
        }
    }, [initialQuery, activeFilter, fetchResults, showDiscoveryContent]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            window.location.hash = `#/search?q=${encodeURIComponent(query)}&filter=${activeFilter}`;
        }
    };
    
    const handleFilterChange = (filter: FilterType) => {
        if (query.trim()) {
            // Simply update the URL. The component will be re-mounted with new props.
            window.location.hash = `#/search?q=${encodeURIComponent(query)}&filter=${filter}`;
        }
    };
    
    const handlePinToggle = (feed:AppBskyFeedDefs.GeneratorView) => {
        const isPinned = pinnedUris.has(feed.uri);
        if (isPinned) {
            togglePin(feed.uri);
        } else {
            addFeed(feed, true);
        }
    }
    
     // Effect for IntersectionObserver
    useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore && supportsInfiniteScroll) {
              fetchResults(initialQuery, activeFilter, cursor);
            }
          },
          { rootMargin: '400px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => {
          if (currentLoader) observer.unobserve(currentLoader);
        };
    }, [hasMore, isLoading, isLoadingMore, fetchResults, initialQuery, activeFilter, cursor, supportsInfiniteScroll]);

    const renderResults = () => {
      if (activeFilter === 'people') {
        return (
          <div className="space-y-3">
            {(results as AppBskyActorDefs.ProfileView[]).map(actor => (
                <ActorSearchResultCard key={actor.did} actor={actor} />
            ))}
          </div>
        );
      }

      if (activeFilter === 'feeds') {
        return (
          <div className="space-y-3">
            {(results as AppBskyFeedDefs.GeneratorView[]).map(feed => (
                <FeedSearchResultCard
                    key={feed.uri} 
                    feed={feed}
                    isPinned={pinnedUris.has(feed.uri)}
                    onTogglePin={() => handlePinToggle(feed)}
                />
            ))}
          </div>
        );
      }
      
      const postResults = results as AppBskyFeedDefs.PostView[];
      return (
        <div className="columns-2 gap-4">
          {postResults.map(post => (
            <div key={post.cid} className="break-inside-avoid mb-4">
              <PostCard feedViewPost={{ post }} />
            </div>
          ))}
        </div>
      );
    }
    
    return (
        <div>
            <SearchHeader />
            <div className="mt-4">
                <form onSubmit={handleFormSubmit} className="flex gap-2 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search posts, users, and feeds`}
                            className="w-full pl-12 pr-4 py-3 bg-surface-2 rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-3 outline-none transition duration-200"
                        />
                    </div>
                </form>

                {showDiscoveryContent ? (
                     <div className="space-y-8">
                        <SuggestedFollows />
                        <PopularFeeds />
                    </div>
                ) : (
                    <>
                        <div className="no-scrollbar -mx-4 px-4 flex items-center gap-2 overflow-x-auto pb-4 mb-4">
                            {filters.map(filter => (
                                <button 
                                    key={filter.id}
                                    onClick={() => handleFilterChange(filter.id)}
                                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2
                                        ${activeFilter === filter.id ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-3'}
                                    `}
                                >
                                    <filter.icon size={16} />
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {isLoading && (
                            isListView ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                         <div key={i} className="bg-surface-2 rounded-xl p-3 h-[88px] animate-pulse"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="columns-2 gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="break-inside-avoid mb-4">
                                            <PostCardSkeleton />
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                        {!isLoading && results.length > 0 && renderResults()}
                        
                        {!isLoading && !isLoadingMore && !hasMore && results.length > 0 && (
                            <div className="text-center text-on-surface-variant py-8">You've reached the end!</div>
                        )}
                        
                        {!isLoading && results.length === 0 && (
                            <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">No results found for "{initialQuery}".</div>
                        )}
                        
                        <div ref={loaderRef} className="h-10">
                            {isLoadingMore && supportsInfiniteScroll && (
                                isListView ? (
                                   <div className="space-y-3 mt-4">
                                       <div className="bg-surface-2 rounded-xl p-3 h-[88px] animate-pulse"></div>
                                   </div>
                                ) : (
                                    <div className="columns-2 gap-4 mt-4">
                                        <div className="break-inside-avoid mb-4"><PostCardSkeleton /></div>
                                        <div className="break-inside-avoid mb-4"><PostCardSkeleton /></div>
                                    </div>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchScreen;
