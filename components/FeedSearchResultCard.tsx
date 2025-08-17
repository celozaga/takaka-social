
import React from 'react';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';

interface FeedSearchResultCardProps {
  feed: AppBskyFeedDefs.GeneratorView;
  isPinned: boolean;
  onTogglePin: () => void;
}

const FeedSearchResultCard: React.FC<FeedSearchResultCardProps> = ({ feed, isPinned, onTogglePin }) => {
    const { session } = useAtp();
    const feedLink = `#/profile/${feed.creator.handle}/feed/${feed.uri.split('/').pop()}`; // Note: This route might not exist, but it's a common pattern.

    return (
        <div className="p-3 bg-surface-2 rounded-xl border border-surface-3">
            <div className="flex items-start gap-3">
                <img src={feed.avatar} alt={feed.displayName} className="w-12 h-12 rounded-lg bg-surface-3 flex-shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="min-w-0">
                            <h3 className="font-bold truncate">{feed.displayName}</h3>
                            <p className="text-sm text-on-surface-variant">Feed by @{feed.creator.handle}</p>
                        </div>
                        {session && (
                             <button 
                                onClick={onTogglePin}
                                className={`font-semibold text-sm py-1.5 px-4 rounded-full transition-colors duration-200 flex-shrink-0
                                    ${isPinned
                                    ? 'bg-surface-3 text-on-surface hover:bg-surface-3/80'
                                    : 'bg-primary text-on-primary hover:bg-primary/90'
                                    }
                                `}
                            >
                                {isPinned ? 'Unpin' : 'Pin Feed'}
                            </button>
                        )}
                    </div>
                    {feed.description && <p className="text-sm mt-1 text-on-surface line-clamp-2">{feed.description.replace(/\n/g, ' ')}</p>}
                </div>
            </div>
        </div>
    );
};

export default FeedSearchResultCard;
