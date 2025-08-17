
import React from 'react';
import { useSavedFeeds } from '../hooks/useSavedFeeds';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';
import { ArrowUp, ArrowDown, Pin, PinOff, Trash2 } from 'lucide-react';

const FeedsScreen: React.FC = () => {
    const { session } = useAtp();
    const { isLoading, pinnedUris, allUris, feedViews, togglePin, removeFeed, reorder } = useSavedFeeds();

    const { pinnedFeeds, savedFeeds } = allUris.reduce<{
        pinnedFeeds: AppBskyFeedDefs.GeneratorView[],
        savedFeeds: AppBskyFeedDefs.GeneratorView[]
    }>((acc, uri) => {
        const feed = feedViews.get(uri);
        if (feed) {
            if (pinnedUris.has(uri)) {
                acc.pinnedFeeds.push(feed);
            } else {
                acc.savedFeeds.push(feed);
            }
        }
        return acc;
    }, { pinnedFeeds: [], savedFeeds: [] });


    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < pinnedFeeds.length) {
            reorder(index, newIndex);
        }
    };
    
    const feedLink = (feed: AppBskyFeedDefs.GeneratorView) => `#/profile/${feed.creator.handle}/feed/${feed.uri.split('/').pop()}`;


    if (!session) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-6">Feeds</h1>
                <div className="text-center p-8 bg-surface-2 rounded-xl">
                    <p className="font-bold">Sign in to manage your feeds</p>
                    <p className="text-on-surface-variant text-sm mt-1">Pin, save, and reorder your favorite content streams.</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-6">Manage Feeds</h1>
                <div className="space-y-4">
                    <div className="bg-surface-2 rounded-xl h-24 animate-pulse"></div>
                    <div className="bg-surface-2 rounded-xl h-36 animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Manage Feeds</h1>
            </div>

            <div className="space-y-8">
                <div>
                    <h2 className="text-lg font-bold mb-2">Pinned Feeds</h2>
                    <div className="space-y-2">
                        {pinnedFeeds.map((feed, index) => (
                            <div key={feed.uri} className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg border border-surface-3">
                                <a href={feedLink(feed)} className="flex items-center gap-2 flex-grow truncate hover:opacity-80 transition-opacity">
                                    <img src={feed.avatar} alt="" className="w-10 h-10 rounded-md flex-shrink-0 bg-surface-3" />
                                    <div className="flex-grow truncate">
                                        <p className="font-semibold truncate">{feed.displayName}</p>
                                        <p className="text-xs text-on-surface-variant truncate">by @{feed.creator.handle}</p>
                                    </div>
                                </a>
                                <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1.5 rounded-full hover:bg-surface-3 disabled:opacity-30" title="Move up"><ArrowUp size={18} /></button>
                                <button onClick={() => handleMove(index, 'down')} disabled={index === pinnedFeeds.length - 1} className="p-1.5 rounded-full hover:bg-surface-3 disabled:opacity-30" title="Move down"><ArrowDown size={18} /></button>
                                <button onClick={() => togglePin(feed.uri)} className="p-1.5 rounded-full hover:bg-surface-3 text-primary" title="Unpin Feed"><PinOff size={18} /></button>
                            </div>
                        ))}
                        {pinnedFeeds.length === 0 && <p className="text-sm text-on-surface-variant p-4 text-center bg-surface-2 rounded-lg">No feeds pinned yet. Feeds you save will appear in the list below.</p>}
                    </div>
                </div>
                <div>
                    <h2 className="text-lg font-bold mb-2">Saved Feeds</h2>
                    <div className="space-y-2">
                        {savedFeeds.map(feed => (
                            <div key={feed.uri} className="flex items-center gap-2 p-2 bg-surface-2 rounded-lg border border-surface-3">
                                <a href={feedLink(feed)} className="flex items-center gap-2 flex-grow truncate hover:opacity-80 transition-opacity">
                                    <img src={feed.avatar} alt="" className="w-10 h-10 rounded-md flex-shrink-0 bg-surface-3" />
                                    <div className="flex-grow truncate">
                                        <p className="font-semibold truncate">{feed.displayName}</p>
                                        <p className="text-xs text-on-surface-variant truncate">by @{feed.creator.handle}</p>
                                    </div>
                                </a>
                                <button onClick={() => togglePin(feed.uri)} className="p-1.5 rounded-full hover:bg-surface-3 text-primary" title="Pin Feed"><Pin size={18} /></button>
                                <button onClick={() => removeFeed(feed.uri)} className="p-1.5 rounded-full hover:bg-surface-3 text-error" title="Remove Feed"><Trash2 size={18} /></button>
                            </div>
                        ))}
                        {savedFeeds.length === 0 && pinnedFeeds.length > 0 && <p className="text-sm text-on-surface-variant p-4 text-center bg-surface-2 rounded-lg">You have no other saved feeds.</p>}
                        {savedFeeds.length === 0 && pinnedFeeds.length === 0 && <p className="text-sm text-on-surface-variant p-4 text-center bg-surface-2 rounded-lg">Feeds you save will appear here. Find new feeds on the Search page.</p>}
                    </div>
                </div>
                 <p className="text-center text-on-surface-variant text-sm pt-4">You can discover and add new feeds from the <a href="#/search" className="text-primary hover:underline">Search</a> page.</p>
            </div>
        </div>
    );
};

export default FeedsScreen;
