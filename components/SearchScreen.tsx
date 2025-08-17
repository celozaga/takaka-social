

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs, AppBskyActorDefs, AppBskyEmbedImages, AppBskyEmbedRecordWithMedia, AppBskyEmbedVideo } from '@atproto/api';
import PostCard from './PostCard';
import { Search, UserCircle, Image as ImageIcon, Video, TrendingUp, Clock } from 'lucide-react';
import PostCardSkeleton from './PostCardSkeleton';
import ActorSearchResultCard from './ActorSearchResultCard';

type SearchResult = AppBskyFeedDefs.PostView | AppBskyActorDefs.ProfileView;
type FilterType = 'top' | 'latest' | 'images' | 'videos' | 'people';

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
];

const SearchScreen: React.FC<SearchScreenProps> = ({ initialQuery = '', initialFilter = 'top' }) => {
    const { agent } = useAtp();
    const [query, setQuery] = useState(initialQuery);
    const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter as FilterType || 'top');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);
    
    const loaderRef = useRef<HTMLDivElement>(null);

    const isPostSearch = activeFilter !== 'people';

    const fetchResults = useCallback(async (searchQuery: string, searchFilter: FilterType, currentCursor?: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setHasSearched(false);
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
        setHasSearched(true);
        
        try {
            if (searchFilter === 'people') {
                const response = await agent.app.bsky.actor.searchActors({ term: searchQuery, limit: 30, cursor: currentCursor });
                setResults(prev => currentCursor ? [...prev, ...response.data.actors] : response.data.actors);
                setCursor(response.data.cursor);
                setHasMore(!!response.data.cursor);
            } else { // All other filters are post searches
                let allFetchedPosts: AppBskyFeedDefs.PostView[] = [];
                let nextCursor: string | undefined = currentCursor;
                let attempts = 0;

                // For media searches, we might need to fetch multiple pages to get enough results
                while (attempts < 5) {
                    attempts++;
                    const response = await agent.app.bsky.feed.searchPosts({ 
                        q: searchQuery, 
                        limit: 50, // Fetch more for media filters to get a good amount
                        cursor: nextCursor,
                        sort: searchFilter === 'latest' ? 'latest' : 'top',
                    });
                    
                    allFetchedPosts = [...allFetchedPosts, ...response.data.posts];
                    nextCursor = response.data.cursor;

                    if (searchFilter === 'images' || searchFilter === 'videos') {
                        const mediaPosts = allFetchedPosts.filter(post => {
                            const embed = post.embed;
                            if (!embed) return false;
                            const targetType = searchFilter === 'images' ? 'app.bsky.embed.images#view' : 'app.bsky.embed.video#view';
                            if (embed.$type === targetType) return true;
                            if (AppBskyEmbedRecordWithMedia.isView(embed)) {
                                if (embed.media?.$type === targetType) return true;
                            }
                            return false;
                        });
                        
                        // If we found enough media posts or there's no more to fetch, break
                        if (mediaPosts.length >= 10 || !nextCursor) {
                            allFetchedPosts = mediaPosts;
                            break;
                        }
                    } else {
                        // For 'top' and 'latest', one page is enough per call
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
        fetchResults(initialQuery, activeFilter);
    }, [initialQuery, activeFilter, fetchResults]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.hash = `#/search?q=${encodeURIComponent(query)}&filter=${activeFilter}`;
    };
    
    const handleFilterChange = (filter: FilterType) => {
        setActiveFilter(filter);
        window.location.hash = `#/search?q=${encodeURIComponent(query)}&filter=${filter}`;
    };
    
     // Effect for IntersectionObserver
    useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore && isPostSearch) {
              fetchResults(query, activeFilter, cursor);
            }
          },
          { rootMargin: '400px' }
        );
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => {
          if (currentLoader) observer.unobserve(currentLoader);
        };
    }, [hasMore, isLoading, isLoadingMore, fetchResults, query, activeFilter, cursor, isPostSearch]);

    const renderResults = () => {
      if (!isPostSearch) {
        return (
          <div className="space-y-3">
            {(results as AppBskyActorDefs.ProfileView[]).map(actor => (
                <ActorSearchResultCard key={actor.did} actor={actor} />
            ))}
          </div>
        );
      }
      
      const postResults = results as AppBskyFeedDefs.PostView[];
      return (
        <div className="columns-2 gap-4">
          {postResults.map(post => (
            <div key={post.cid} className="break-inside-avoid mb-4">
              <PostCard post={post} />
            </div>
          ))}
        </div>
      );
    }
    
    return (
        <div>
            <form onSubmit={handleFormSubmit} className="flex gap-2 mb-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search...`}
                        className="w-full pl-12 pr-4 py-3 bg-surface-3 border-b-2 border-surface-3 rounded-t-lg focus:ring-0 focus:border-primary focus:bg-surface-3 outline-none transition duration-200"
                    />
                </div>
            </form>

            <div className="no-scrollbar -mx-4 px-4 flex items-center gap-2 overflow-x-auto pb-2 mb-4 border-b border-surface-3">
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
                <div className="columns-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="break-inside-avoid mb-4">
                            <PostCardSkeleton />
                        </div>
                    ))}
                </div>
            )}
            {!isLoading && results.length > 0 && renderResults()}
            
            {!isLoading && !isLoadingMore && !hasMore && results.length > 0 && isPostSearch && (
                <div className="text-center text-on-surface-variant py-8">You've reached the end!</div>
            )}
            
            {!isLoading && results.length === 0 && hasSearched && (
                 <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">No results found for "{query}".</div>
            )}
            
            <div ref={loaderRef} className="h-10">
                {isLoadingMore && isPostSearch && (
                  <div className="columns-2 gap-4 mt-4">
                    <div className="break-inside-avoid mb-4">
                        <PostCardSkeleton />
                    </div>
                     <div className="break-inside-avoid mb-4">
                        <PostCardSkeleton />
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
};

export default SearchScreen;