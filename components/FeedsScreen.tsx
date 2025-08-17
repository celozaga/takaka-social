
import React, { useState, useEffect } from 'react';
import { useSavedFeeds } from '../hooks/useSavedFeeds';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';
import FeedSearchResultCard from './FeedSearchResultCard';
import { Settings, Check, Search, ArrowUp, ArrowDown, PinOff, Trash2 } from 'lucide-react';

const FeedsScreen: React.FC = () => {
    const { agent, session } = useAtp();
    const { isLoading, pinnedUris, allUris, feedViews, togglePin, removeFeed, addFeed, reorder, load } = useSavedFeeds();
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AppBskyFeedDefs.GeneratorView[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const pinnedFeeds = allUris.filter(uri => pinnedUris.has(uri)).map(uri => feedViews.get(uri)).filter(Boolean) as AppBskyFeedDefs.GeneratorView[];
    const savedFeeds = allUris.filter(uri => !pinnedUris.has(uri)).map(uri => feedViews.get(uri)).filter(Boolean) as AppBskyFeedDefs.GeneratorView[];

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            // Corrected API call to use the unspecced namespace for searching feeds
            const { data } = await (agent.api.app.bsky.unspecced as any).searchFeedGenerators({ q: searchQuery, limit: 25 });
            setSearchResults(data.feeds);
        } catch (error) {
            console.error("Feed search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleTogglePin = (feed: AppBskyFeedDefs.GeneratorView) => {
        if (!session) return;
        const isSaved = allUris.includes(feed.uri);
        if (isSaved) {
            togglePin(feed.uri);
        } else {
            addFeed(feed, true);
        }
    }
    
    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < pinnedFeeds.length) {
            reorder(index, newIndex);
        }
    };
    
    const toggleMode = () => {
        if (mode === 'edit') {
            load(); // Refresh state when exiting edit mode
        }
        setMode(prev => prev === 'view' ? 'edit' : 'view');
    }

    const renderMyFeeds = () => {
        if (isLoading) return <div className="bg-surface-2 rounded-xl h-24 animate-pulse"></div>;
        if (allUris.length === 0) {
            return (
                <div className="text-center p-4 bg-surface-2 rounded-xl">
                    <p className="font-semibold">Your feeds are empty</p>
                    <p className="text-sm text-on-surface-variant">Search below to find and pin your first feed.</p>
                </div>
            );
        }
        return (
            <div className="space-y-3">
                {[...pinnedFeeds, ...savedFeeds].map(feed => (
                    <FeedSearchResultCard
                        key={feed.uri}
                        feed={feed}
                        isPinned={pinnedUris.has(feed.uri)}
                        onTogglePin={() => togglePin(feed.uri)}
                    />
                ))}
            </div>
        );
    };

    const renderEditMode = () => (
        <>
            <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">Pinned Feeds</h2>
                <div className="space-y-2">
                    {pinnedFeeds.map((feed, index) => (
                        <div key={feed.uri} className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg">
                             <img src={feed.avatar} alt="" className="w-8 h-8 rounded-md flex-shrink-0" />
                             <div className="flex-grow truncate">
                                <p className="font-semibold truncate text-sm">{feed.displayName}</p>
                                <p className="text-xs text-on-surface-variant truncate">by @{feed.creator.handle}</p>
                             </div>
                             <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1.5 rounded-full hover:bg-surface-3 disabled:opacity-30"><ArrowUp size={16} /></button>
                             <button onClick={() => handleMove(index, 'down')} disabled={index === pinnedFeeds.length - 1} className="p-1.5 rounded-full hover:bg-surface-3 disabled:opacity-30"><ArrowDown size={16} /></button>
                             <button onClick={() => togglePin(feed.uri)} className="p-1.5 rounded-full hover:bg-surface-3 text-primary"><PinOff size={16} /></button>
                        </div>
                    ))}
                    {pinnedFeeds.length === 0 && <p className="text-sm text-on-surface-variant p-2">No feeds pinned yet.</p>}
                </div>
            </div>
            <div>
                <h2 className="text-lg font-bold mb-2">Saved Feeds</h2>
                 <div className="space-y-2">
                    {savedFeeds.map(feed => (
                        <div key={feed.uri} className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg">
                             <img src={feed.avatar} alt="" className="w-8 h-8 rounded-md flex-shrink-0" />
                             <div className="flex-grow truncate">
                                <p className="font-semibold truncate text-sm">{feed.displayName}</p>
                                <p className="text-xs text-on-surface-variant truncate">by @{feed.creator.handle}</p>
                             </div>
                             <button onClick={() => removeFeed(feed.uri)} className="p-1.5 rounded-full hover:bg-surface-3 text-error"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    {savedFeeds.length === 0 && <p className="text-sm text-on-surface-variant p-2">No other saved feeds.</p>}
                 </div>
            </div>
        </>
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Feeds</h1>
                {session && (
                    <button onClick={toggleMode} className="p-2 rounded-full hover:bg-surface-3 transition-colors">
                        {mode === 'view' ? <Settings size={20} /> : <Check size={20} />}
                    </button>
                )}
            </div>
            
            {mode === 'edit' && session ? renderEditMode() : (
                <div className="space-y-8">
                    {session && (
                        <div>
                            <h2 className="text-lg font-bold mb-2">My Feeds</h2>
                            {renderMyFeeds()}
                        </div>
                    )}

                    <div>
                        <h2 className="text-lg font-bold mb-2">Discover new feeds</h2>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for feeds..."
                                    className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-surface-3 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition"
                                />
                            </div>
                        </form>
                        {isSearching ? (
                             <div className="space-y-3">
                                {[...Array(3)].map((_, i) => <div key={i} className="bg-surface-2 rounded-xl h-[88px] animate-pulse"></div>)}
                             </div>
                        ) : (
                            <div className="space-y-3">
                                {searchResults.map(feed => (
                                    <FeedSearchResultCard
                                        key={feed.uri}
                                        feed={feed}
                                        isPinned={pinnedUris.has(feed.uri)}
                                        onTogglePin={() => handleTogglePin(feed)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedsScreen;
