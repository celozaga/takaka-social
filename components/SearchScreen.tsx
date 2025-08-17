
import React, { useState, useCallback, useEffect } from 'react';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs, AppBskyActorDefs, AppBskyEmbedImages, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import PostCard from './PostCard';
import { Search, UserCircle, Image as ImageIcon } from 'lucide-react';
import PostCardSkeleton from './PostCardSkeleton';

type SearchResult = AppBskyFeedDefs.PostView | AppBskyActorDefs.ProfileView;

interface SearchScreenProps {
  initialQuery?: string;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ initialQuery = '' }) => {
    const { agent } = useAtp();
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchType, setSearchType] = useState<'posts' | 'actors'>('posts');
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }
        setIsLoading(true);
        setHasSearched(true);
        setResults([]);

        try {
            if (searchType === 'posts') {
                const response = await agent.app.bsky.feed.searchPosts({ q: searchQuery, limit: 40 });
                const mediaPosts = response.data.posts.filter(post => {
                    const embed = post.embed;
                    if (!embed) return false;
                    if (AppBskyEmbedImages.isView(embed)) return true;
                    if (embed.$type === 'app.bsky.embed.video#view') return true;
                    if (AppBskyEmbedRecordWithMedia.isView(embed)) {
                        const media = embed.media;
                        if (AppBskyEmbedImages.isView(media)) return true;
                        if (media?.$type === 'app.bsky.embed.video#view') return true;
                    }
                    return false;
                });
                setResults(mediaPosts);
            } else {
                const response = await agent.app.bsky.actor.searchActors({ term: searchQuery, limit: 40 });
                setResults(response.data.actors);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
        }
    }, [agent, searchType]);

    useEffect(() => {
        setQuery(initialQuery);
        handleSearch(initialQuery);
    }, [initialQuery, handleSearch]);
    
    useEffect(() => {
      // Re-run search if search type changes
      handleSearch(query);
    }, [searchType]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
    };
    
    const renderResults = () => {
      if (searchType === 'actors') {
        return (
          <div className="space-y-3">
            {results.map(item => {
              const actor = item as AppBskyActorDefs.ProfileView;
              return (
                <a href={`#/profile/${actor.handle}`} key={actor.did} className="flex items-center gap-4 p-4 bg-surface-2 rounded-xl hover:bg-surface-3 transition-colors">
                  <img src={actor.avatar} alt={actor.displayName} className="w-12 h-12 rounded-full bg-surface-3" />
                  <div>
                    <p className="font-bold">{actor.displayName}</p>
                    <p className="text-on-surface-variant">@{actor.handle}</p>
                  </div>
                </a>
              );
            })}
          </div>
        );
      }
      
      return (
        <div className="columns-2 gap-4 space-y-4">
          {results.map(item => {
            const post = item as AppBskyFeedDefs.PostView;
            return (
              <div key={post.cid} className="break-inside-avoid">
                <PostCard post={post} />
              </div>
            );
          })}
        </div>
      );
    }
    
    const segmentBtnClasses = "px-4 py-2 text-sm font-semibold transition-colors flex-1 flex items-center justify-center gap-2";
    const activeSegmentClasses = "bg-primary-container text-on-primary-container";
    const inactiveSegmentClasses = "text-on-surface-variant";

    return (
        <div>
            <form onSubmit={handleFormSubmit} className="flex gap-2 mb-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search ${searchType}...`}
                        className="w-full pl-12 pr-4 py-3 bg-surface-3 border-b-2 border-surface-3 rounded-t-lg focus:ring-0 focus:border-primary focus:bg-surface-3 outline-none transition duration-200"
                    />
                </div>
            </form>
            <div className="flex items-center p-1 gap-1 mb-6 bg-surface-2 rounded-full border border-outline">
                <button onClick={() => setSearchType('posts')} className={`${segmentBtnClasses} rounded-full ${searchType === 'posts' ? activeSegmentClasses : inactiveSegmentClasses}`}>
                    <ImageIcon className="w-4 h-4" />
                    Posts
                </button>
                 <button onClick={() => setSearchType('actors')} className={`${segmentBtnClasses} rounded-full ${searchType === 'actors' ? activeSegmentClasses : inactiveSegmentClasses}`}>
                    <UserCircle className="w-4 h-4" />
                    People
                </button>
            </div>
            {isLoading && (
                <div className="columns-2 gap-4 space-y-4">
                     {[...Array(6)].map((_, i) => <div key={i} className="break-inside-avoid"><PostCardSkeleton /></div>)}
                </div>
            )}
            {!isLoading && results.length > 0 && (
                renderResults()
            )}
            {!isLoading && results.length === 0 && hasSearched && (
                 <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">No results found for "{query}".</div>
            )}
        </div>
    );
};

export default SearchScreen;
