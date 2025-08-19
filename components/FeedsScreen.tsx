
import React, { useState, useEffect } from 'react';
import { useSavedFeeds } from '../hooks/useSavedFeeds';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';
import { Pin, Trash2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import PopularFeeds from './PopularFeeds';
import { useUI } from '../context/UIContext';
import FeedsHeader from './FeedsHeader';
import FeedAvatar from './FeedAvatar';

const EditableFeedItem: React.FC<{
    feed: AppBskyFeedDefs.GeneratorView;
    isPinned: boolean;
    isFirst: boolean;
    isLast: boolean;
    disabled: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onTogglePin: () => void;
    onRemove: () => void;
}> = ({ feed, isPinned, isFirst, isLast, disabled, onMoveUp, onMoveDown, onTogglePin, onRemove }) => {
    return (
        <div className={`flex items-center gap-3 p-2 bg-surface-2 rounded-xl transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <FeedAvatar src={feed.avatar} alt={feed.displayName} className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <a href={`#/profile/${feed.creator.handle}/feed/${feed.uri.split('/').pop()}`} className="font-bold truncate hover:underline">{feed.displayName}</a>
                <p className="text-sm text-on-surface-variant">by @{feed.creator.handle}</p>
            </div>
            <div className="flex items-center gap-0.5 text-on-surface-variant">
                {isPinned ? (
                    <>
                        <button onClick={onMoveUp} disabled={isFirst || disabled} className="p-2 rounded-full hover:bg-surface-3 disabled:opacity-30 disabled:cursor-not-allowed">
                            <ArrowUp size={18} />
                        </button>
                        <button onClick={onMoveDown} disabled={isLast || disabled} className="p-2 rounded-full hover:bg-surface-3 disabled:opacity-30 disabled:cursor-not-allowed">
                            <ArrowDown size={18} />
                        </button>
                        <button onClick={onTogglePin} disabled={disabled} className="p-2 rounded-full text-primary hover:bg-surface-3 disabled:opacity-30 disabled:cursor-not-allowed" title="Unpin">
                            <Pin size={18} fill="currentColor" />
                        </button>
                    </>
                ) : (
                    <>
                         <button onClick={onRemove} disabled={disabled} className="p-2 rounded-full hover:bg-error/20 hover:text-error disabled:opacity-30 disabled:cursor-not-allowed" title="Remove">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onTogglePin} disabled={disabled} className="p-2 rounded-full hover:bg-surface-3 hover:text-on-surface disabled:opacity-30 disabled:cursor-not-allowed" title="Pin">
                            <Pin size={18} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const FeedsScreen: React.FC = () => {
    const { session } = useAtp();
    const { setCustomFeedHeaderVisible } = useUI();
    const { 
        isLoading: isLoadingSavedFeeds, 
        feedViews, 
        preferences,
        reorder,
        togglePin,
        removeFeed
    } = useSavedFeeds();

    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const handleAction = async (action: () => Promise<void>) => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            await action();
        } finally {
            setIsUpdating(false);
        }
    };

    const pinnedItems = preferences?.items.filter(item => item.pinned) || [];
    const savedItems = preferences?.items.filter(item => !item.pinned) || [];

    if (!session) {
        return (
            <div>
                <FeedsHeader />
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">Discover Feeds</h2>
                        <a href="#/search?filter=feeds" className="p-2 -mr-2 rounded-full hover:bg-surface-3" aria-label="Search feeds">
                            <Search size={20} />
                        </a>
                    </div>
                    <PopularFeeds showHeader={false} />
                </div>
            </div>
        );
    }
    
    if (isLoadingSavedFeeds) {
        return (
             <div>
                <FeedsHeader />
                <div className="mt-4">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => <div key={i} className="bg-surface-2 rounded-xl h-20 animate-pulse"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <FeedsHeader />
            <div className="mt-4">
                <p className="text-on-surface-variant text-sm mb-6">
                    Reorder, pin, or remove your feeds. Changes are saved automatically.
                </p>

                <div className="space-y-6">
                    <section>
                        <h2 className="text-lg font-bold mb-3 text-on-surface-variant">Pinned Feeds</h2>
                        {pinnedItems.length > 0 ? (
                            <div className="space-y-2">
                                {pinnedItems.map((item, index) => {
                                    const feed = feedViews.get(item.value);
                                    if (!feed) return null;
                                    const currentIndex = pinnedItems.findIndex(i => i.value === item.value);
                                    return <EditableFeedItem
                                        key={item.id}
                                        feed={feed}
                                        isPinned={true}
                                        isFirst={index === 0}
                                        isLast={index === pinnedItems.length - 1}
                                        disabled={isUpdating}
                                        onMoveUp={() => handleAction(() => reorder(currentIndex, currentIndex - 1))}
                                        onMoveDown={() => handleAction(() => reorder(currentIndex, currentIndex + 1))}
                                        onTogglePin={() => handleAction(() => togglePin(item.value))}
                                        onRemove={() => handleAction(() => removeFeed(item.value))}
                                    />
                                })}
                            </div>
                        ) : <p className="text-on-surface-variant text-sm text-center py-4 bg-surface-2 rounded-lg">Pin a saved feed below to add it here.</p>}
                    </section>
                    
                     <section>
                        <h2 className="text-lg font-bold mb-3 text-on-surface-variant">Saved Feeds</h2>
                        {savedItems.length > 0 ? (
                            <div className="space-y-2">
                                {savedItems.map((item) => {
                                    const feed = feedViews.get(item.value);
                                    if (!feed) return null;
                                    return <EditableFeedItem
                                        key={item.id}
                                        feed={feed}
                                        isPinned={false}
                                        isFirst={false} isLast={false} onMoveUp={()=>{}} onMoveDown={()=>{}}
                                        disabled={isUpdating}
                                        onTogglePin={() => handleAction(() => togglePin(item.value))}
                                        onRemove={() => handleAction(() => removeFeed(item.value))}
                                    />
                                })}
                            </div>
                        ) : (
                            <div className="text-on-surface-variant text-sm text-center py-4 bg-surface-2 rounded-lg">
                                <p>You have no other saved feeds.</p>
                                <a href="#/search?filter=feeds" className="font-semibold text-primary hover:underline mt-1 inline-block">Find New Feeds</a>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default FeedsScreen;
