import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useHiddenPosts } from '../../context/HiddenPostsContext';
import { AppBskyFeedDefs, AppBskyActorDefs } from '@atproto/api';
import PostBubble from '../post/PostBubble';
import { Search, UserCircle, TrendingUp, Clock } from 'lucide-react';
import ActorSearchResultCard from '../search/ActorSearchResultCard';
import SuggestedFollows from '../profile/SuggestedFollows';
import ScreenHeader from '../layout/ScreenHeader';
import TrendingTopics from './TrendingTopics';

type SearchResult = AppBskyFeedDefs.PostView | AppBskyActorDefs.ProfileView;
type FilterType = 'top' | 'latest' | 'people';

interface SearchScreenProps {
  initialQuery?: string;
  initialFilter?: string;
}

const filters: { id: FilterType; label: string; icon: React.FC<any> }[] = [
    { id: 'top', label: 'Top', icon: TrendingUp },
    { id: 'latest', label: 'Latest', icon: Clock },
    { id: 'people', label: 'Profiles', icon: UserCircle },
];

const SearchScreen: React.FC<SearchScreenProps> = ({ initialQuery = '', initialFilter = 'top' }) => {
    const { agent } = useAtp();
    const { hiddenPostUris } = useHiddenPosts();
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    
    const loaderRef = useRef<HTMLDivElement>(null);

    const activeFilter = (initialFilter as FilterType) || 'top';
    
    const showDiscoveryContent = !initialQuery.trim();

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
            } else { // 'top' or 'latest'
                const response = await agent.app.bsky.feed.searchPosts({ 
                    q: searchQuery, 
                    limit: 50,
                    cursor: currentCursor,
                    sort: searchFilter === 'latest' ? 'latest' : 'top',
                });
                
                const visiblePosts = response.data.posts.filter(p => !hiddenPostUris.has(p.uri));

                setResults(prev => currentCursor ? [...prev, ...visiblePosts] : visiblePosts);
                setCursor(response.data.cursor);
                setHasMore(!!response.data.cursor && response.data.posts.length > 0);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [agent, hiddenPostUris]);
    
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
            window.location.hash = `#/search?q=${encodeURIComponent(query)}&filter=${filter}`;
        }
    };
    
    useEffect(() => {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
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
    }, [hasMore, isLoading, isLoadingMore, fetchResults, initialQuery, activeFilter, cursor]);

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
      
      const postResults = results as AppBskyFeedDefs.PostView[];
      
      return (
        <div className="space-y-4">
          {postResults.map((post) => (
            <PostBubble key={post.cid} post={post} showAuthor />
          ))}
        </div>
      );
    }
    
    return (
        <div>
            <ScreenHeader title="Search" />
            <div className="mt-4">
                <form onSubmit={handleFormSubmit} className="flex gap-2 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search profiles and posts"
                            className="w-full pl-12 pr-4 py-3 bg-surface-2 rounded-lg focus:ring-1 focus:ring-primary focus:bg-surface-3 outline-none transition duration-200"
                        />
                    </div>
                </form>

                {showDiscoveryContent ? (
                     <div className="space-y-8">
                        <TrendingTopics />
                        <SuggestedFollows />
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
                            <div className="space-y-3">
                                {[...Array(5)].map((_, i) => (
                                     <div key={i} className="bg-surface-2 rounded-xl p-3 h-24 animate-pulse"></div>
                                ))}
                            </div>
                        )}
                        {!isLoading && results.length > 0 && renderResults()}
                        
                        {!isLoading && !isLoadingMore && !hasMore && results.length > 0 && (
                            <div className="text-center text-on-surface-variant py-8">You've reached the end!</div>
                        )}
                        
                        {!isLoading && results.length === 0 && (
                            <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">No results found for "{initialQuery}".</div>
                        )}
                        
                        <div ref={loaderRef} className="h-10">
                            {isLoadingMore && (
                               <div className="space-y-3 mt-4">
                                   <div className="bg-surface-2 rounded-xl p-3 h-24 animate-pulse"></div>
                               </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchScreen;
