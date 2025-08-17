
import React from 'react';
import { useSavedFeeds } from '../hooks/useSavedFeeds';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';
import { Pin, PinOff, Trash2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import PopularFeeds from './PopularFeeds';

const FeedItem: React.FC<{
    feed: AppBskyFeedDefs.GeneratorView;
    isPinned: boolean;
    onTogglePin: () => void;
    onRemove?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
}> = ({ feed, isPinned, onTogglePin, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
    const feedLink = `#/profile/${feed.creator.handle}/feed/${feed.uri.split('/').pop()}`;

    return (
        <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl border border-surface-3">
            <img src={feed.avatar} alt={feed.displayName} className="w-12 h-12 rounded-lg bg-surface-3 flex-shrink-0" loading="lazy" />
            <div className="flex-1 min-w-0">
                <a href={feedLink} className="block hover:opacity-80">
                    <h3 className="font-bold truncate">{feed.displayName}</h3>
                    <p className="text-sm text-on-surface-variant">by @{feed.creator.handle}</p>
                </a>
            </div>
            <div className="flex items-center gap-1">
                {isPinned && onMoveUp && onMoveDown && (
                    <>
                        <button onClick={onMoveUp} disabled={isFirst} className="p-2 rounded-full hover:bg-surface-3 disabled:opacity-50" title="Move up">
                            <ArrowUp size={18} />
                        </button>
                        <button onClick={onMoveDown} disabled={isLast} className="p-2 rounded-full hover:bg-surface-3 disabled:opacity-50" title="Move down">
                            <ArrowDown size={18} />
                        </button>
                    </>
                )}
                <button onClick={onTogglePin} className="p-2 rounded-full hover:bg-surface-3" title={isPinned ? 'Unpin' : 'Pin'}>
                    {isPinned ? <PinOff size={18} className="text-primary" /> : <Pin size={18} />}
                </button>
                {onRemove && (
                    <button onClick={onRemove} className="p-2 rounded-full hover:bg-error/20 text-on-surface-variant hover:text-error" title="Remove">
                        <Trash2 size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

const FeedsScreen: React.FC = () => {
    const { session } = useAtp();
    const { 
        isLoading: isLoadingSavedFeeds, 
        pinnedUris, 
        allUris, 
        feedViews, 
        togglePin, 
        removeFeed, 
        reorder 
    } = useSavedFeeds();
    
    const pinnedFeedItems = React.useMemo(() => 
        [...pinnedUris]
            .map(uri => feedViews.get(uri))
            .filter((feed): feed is AppBskyFeedDefs.GeneratorView => !!feed),
        [pinnedUris, feedViews]
    );
    
    // Sort pinned feeds based on the order in the preferences
    const orderedPinnedFeeds = React.useMemo(() => {
        const uris = [...pinnedUris];
        return pinnedFeedItems.sort((a, b) => uris.indexOf(a.uri) - uris.indexOf(b.uri));
    }, [pinnedFeedItems, pinnedUris]);


    const savedFeedItems = React.useMemo(() =>
        allUris.filter(uri => !pinnedUris.has(uri))
            .map(uri => feedViews.get(uri))
            .filter((feed): feed is AppBskyFeedDefs.GeneratorView => !!feed),
        [allUris, pinnedUris, feedViews]
    );

    if (!session) {
        return (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Discover Feeds</h1>
                    <a href="#/search" className="p-2 -mr-2 rounded-full hover:bg-surface-3" aria-label="Search feeds">
                        <Search size={20} />
                    </a>
                </div>
                <PopularFeeds showHeader={false} />
            </div>
        );
    }
    
    if (isLoadingSavedFeeds) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-4">My Feeds</h1>
                <div className="space-y-4">
                    <div className="bg-surface-2 rounded-xl h-20 animate-pulse"></div>
                    <div className="bg-surface-2 rounded-xl h-20 animate-pulse"></div>
                    <div className="bg-surface-2 rounded-xl h-20 animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">My Feeds</h1>
                 <a href="#/search?filter=feeds" className="font-semibold text-sm py-2 px-4 rounded-full transition-colors bg-surface-3 text-on-surface hover:bg-surface-3/80">
                    Find More
                </a>
            </div>

            <div className="space-y-6">
                <section>
                    <h2 className="text-lg font-bold mb-3 text-on-surface-variant">Pinned Feeds</h2>
                    {orderedPinnedFeeds.length > 0 ? (
                        <div className="space-y-2">
                            {orderedPinnedFeeds.map((feed, index) => (
                                <div key={feed.uri}>
                                    <FeedItem
                                        feed={feed}
                                        isPinned={true}
                                        onTogglePin={() => togglePin(feed.uri)}
                                        onMoveUp={() => reorder(index, index - 1)}
                                        onMoveDown={() => reorder(index, index + 1)}
                                        isFirst={index === 0}
                                        isLast={index === orderedPinnedFeeds.length - 1}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-on-surface-variant p-6 bg-surface-2 rounded-xl border border-surface-3">
                            <p>You haven't pinned any feeds yet.</p>
                            <p className="text-sm">Find feeds to pin and they'll appear on your home screen.</p>
                        </div>
                    )}
                </section>
                
                <section>
                     <h2 className="text-lg font-bold mb-3 text-on-surface-variant">Other Saved Feeds</h2>
                    {savedFeedItems.length > 0 ? (
                         <div className="space-y-2">
                            {savedFeedItems.map(feed => (
                                <FeedItem
                                    key={feed.uri}
                                    feed={feed}
                                    isPinned={false}
                                    onTogglePin={() => togglePin(feed.uri)}
                                    onRemove={() => removeFeed(feed.uri)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-on-surface-variant p-6 bg-surface-2 rounded-xl border border-surface-3">
                            <p>Your other saved feeds will appear here.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default FeedsScreen;
