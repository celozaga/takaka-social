
import React, { useState, useEffect } from 'react';
import { useSavedFeeds } from '../hooks/useSavedFeeds';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs, AppBskyActorDefs } from '@atproto/api';
import { Pin, Trash2, Search, Settings, ArrowUp, ArrowDown, ChevronRight, List } from 'lucide-react';
import PopularFeeds from './PopularFeeds';

type FeedPrefItem = AppBskyActorDefs.SavedFeed;

const EditableFeedItem: React.FC<{
    feed: AppBskyFeedDefs.GeneratorView;
    isPinned: boolean;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onTogglePin: () => void;
    onRemove: () => void;
}> = ({ feed, isPinned, isFirst, isLast, onMoveUp, onMoveDown, onTogglePin, onRemove }) => {
    return (
        <div className="flex items-center gap-3 p-2 bg-surface-2 rounded-xl border border-surface-3">
            <img src={feed.avatar} alt={feed.displayName} className="w-10 h-10 rounded-lg bg-surface-3 flex-shrink-0" loading="lazy" />
            <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{feed.displayName}</h3>
                <p className="text-sm text-on-surface-variant">by @{feed.creator.handle}</p>
            </div>
            <div className="flex items-center gap-0.5 text-on-surface-variant">
                {isPinned ? (
                    <>
                        <button onClick={onMoveUp} disabled={isFirst} className="p-2 rounded-full hover:bg-surface-3 disabled:opacity-30 disabled:cursor-not-allowed">
                            <ArrowUp size={18} />
                        </button>
                        <button onClick={onMoveDown} disabled={isLast} className="p-2 rounded-full hover:bg-surface-3 disabled:opacity-30 disabled:cursor-not-allowed">
                            <ArrowDown size={18} />
                        </button>
                        <button onClick={onTogglePin} className="p-2 rounded-full text-primary hover:bg-surface-3" title="Unpin">
                            <Pin size={18} fill="currentColor" />
                        </button>
                    </>
                ) : (
                    <>
                         <button onClick={onRemove} className="p-2 rounded-full hover:bg-error/20 hover:text-error" title="Remove">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onTogglePin} className="p-2 rounded-full hover:bg-surface-3 hover:text-on-surface" title="Pin">
                            <Pin size={18} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const FeedLinkItem: React.FC<{ feed: AppBskyFeedDefs.GeneratorView }> = ({ feed }) => {
    const feedLink = `#/profile/${feed.creator.handle}/feed/${feed.uri.split('/').pop()}`;
    return (
        <a href={feedLink} className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl border border-surface-3 hover:bg-surface-3 transition-colors">
            <img src={feed.avatar} alt={feed.displayName} className="w-12 h-12 rounded-lg bg-surface-3 flex-shrink-0" loading="lazy" />
            <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{feed.displayName}</h3>
            </div>
            <ChevronRight className="w-5 h-5 text-on-surface-variant flex-shrink-0" />
        </a>
    );
};

const FeedsScreen: React.FC = () => {
    const { session } = useAtp();
    const { 
        isLoading: isLoadingSavedFeeds, 
        feedViews, 
        preferences,
        savePreferences
    } = useSavedFeeds();

    const [isEditMode, setIsEditMode] = useState(false);
    const [draftItems, setDraftItems] = useState<FeedPrefItem[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (isEditMode && preferences) {
            setDraftItems([...preferences.items]);
            setHasChanges(false);
        }
    }, [isEditMode, preferences]);

    const handleSaveChanges = async () => {
        if (!preferences || !hasChanges) return;
        const newPrefs = { ...preferences, items: draftItems };
        await savePreferences(newPrefs);
        setIsEditMode(false);
        setHasChanges(false);
    };
    
    const handleCancel = () => {
        setIsEditMode(false);
        setHasChanges(false);
    };

    const handleMove = (uri: string, direction: 'up' | 'down') => {
        setDraftItems(prev => {
            const pinned = prev.filter(i => i.pinned);
            const unpinned = prev.filter(i => !i.pinned);
            const index = pinned.findIndex(i => i.value === uri);
            if (direction === 'up' && index > 0) {
                [pinned[index - 1], pinned[index]] = [pinned[index], pinned[index - 1]];
            }
            if (direction === 'down' && index < pinned.length - 1) {
                [pinned[index + 1], pinned[index]] = [pinned[index], pinned[index + 1]];
            }
            return [...pinned, ...unpinned];
        });
        setHasChanges(true);
    };

    const handleTogglePin = (uri: string) => {
        setDraftItems(prev => {
            const newItems = prev.map(item => item.value === uri ? { ...item, pinned: !item.pinned } : item);
            const pinned = newItems.filter(i => i.pinned);
            const unpinned = newItems.filter(i => !i.pinned);
            return [...pinned, ...unpinned];
        });
        setHasChanges(true);
    };

    const handleRemove = (uri: string) => {
        setDraftItems(prev => prev.filter(item => item.value !== uri));
        setHasChanges(true);
    };
    
    const allFeeds = React.useMemo(() =>
        (preferences?.items || [])
            .map(item => feedViews.get(item.value))
            .filter((feed): feed is AppBskyFeedDefs.GeneratorView => !!feed),
        [preferences, feedViews]
    );

    const draftPinnedItems = draftItems.filter(i => i.pinned);
    const draftSavedItems = draftItems.filter(i => !i.pinned);

    if (!session) {
        return (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Discover Feeds</h1>
                    <a href="#/search?filter=feeds" className="p-2 -mr-2 rounded-full hover:bg-surface-3" aria-label="Search feeds">
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
                    {[...Array(3)].map((_, i) => <div key={i} className="bg-surface-2 rounded-xl h-20 animate-pulse"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Feeds</h1>
                {isEditMode ? (
                    <div className="flex items-center gap-2">
                         <button onClick={handleCancel} className="font-semibold text-sm py-2 px-4 rounded-full transition-colors bg-surface-3 text-on-surface hover:bg-surface-3/80">
                            Cancel
                        </button>
                        <button onClick={handleSaveChanges} disabled={!hasChanges} className="font-semibold text-sm py-2 px-4 rounded-full transition-colors bg-primary text-on-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed">
                            Save changes
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditMode(true)} className="p-2 -mr-2 rounded-full hover:bg-surface-3" aria-label="Edit Feeds">
                        <Settings size={20} />
                    </button>
                )}
            </div>

            {isEditMode ? (
                 <div className="space-y-6">
                    <section>
                        <h2 className="text-lg font-bold mb-3 text-on-surface-variant">Pinned Feeds</h2>
                        {draftPinnedItems.length > 0 ? (
                            <div className="space-y-2">
                                {draftPinnedItems.map((item, index) => {
                                    const feed = feedViews.get(item.value);
                                    if (!feed) return null;
                                    return <EditableFeedItem
                                        key={item.id}
                                        feed={feed}
                                        isPinned={true}
                                        isFirst={index === 0}
                                        isLast={index === draftPinnedItems.length - 1}
                                        onMoveUp={() => handleMove(item.value, 'up')}
                                        onMoveDown={() => handleMove(item.value, 'down')}
                                        onTogglePin={() => handleTogglePin(item.value)}
                                        onRemove={() => handleRemove(item.value)}
                                    />
                                })}
                            </div>
                        ) : <p className="text-on-surface-variant text-sm text-center py-4">Pin a saved feed below to add it here.</p>}
                    </section>
                     <section>
                        <h2 className="text-lg font-bold mb-3 text-on-surface-variant">Saved Feeds</h2>
                        {draftSavedItems.length > 0 ? (
                            <div className="space-y-2">
                                {draftSavedItems.map((item) => {
                                    const feed = feedViews.get(item.value);
                                    if (!feed) return null;
                                    return <EditableFeedItem
                                        key={item.id}
                                        feed={feed}
                                        isPinned={false}
                                        isFirst={false} isLast={false} onMoveUp={()=>{}} onMoveDown={()=>{}}
                                        onTogglePin={() => handleTogglePin(item.value)}
                                        onRemove={() => handleRemove(item.value)}
                                    />
                                })}
                            </div>
                        ) : <p className="text-on-surface-variant text-sm text-center py-4">You have no other saved feeds.</p>}
                    </section>
                 </div>
            ) : (
                <div>
                     <div className="text-center mb-4 p-4 bg-surface-2 rounded-xl border border-surface-3">
                         <List className="mx-auto w-12 h-12 text-primary p-2 bg-primary-container rounded-full mb-2" />
                         <h2 className="text-lg font-bold">My Feeds</h2>
                         <p className="text-sm text-on-surface-variant">All the feeds you've saved, right in one place.</p>
                     </div>
                     {allFeeds.length > 0 ? (
                        <div className="space-y-2">
                            {allFeeds.map(feed => <FeedLinkItem key={feed.uri} feed={feed} />)}
                        </div>
                     ) : (
                         <div className="text-center text-on-surface-variant p-6 bg-surface-2 rounded-xl border border-surface-3">
                            <p>You haven't saved any feeds yet.</p>
                             <a href="#/search?filter=feeds" className="font-semibold text-primary hover:underline mt-2 inline-block">Find Feeds</a>
                        </div>
                     )}
                </div>
            )}
        </div>
    );
};

export default FeedsScreen;
