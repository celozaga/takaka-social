import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs } from '@atproto/api';
import FeedAvatar from './FeedAvatar';

interface FeedSearchResultCardProps {
  feed: AppBskyFeedDefs.GeneratorView;
  isPinned: boolean;
  onTogglePin: () => void;
}

const FeedSearchResultCard: React.FC<FeedSearchResultCardProps> = ({ feed, isPinned, onTogglePin }) => {
    const { session } = useAtp();
    const { t } = useTranslation();
    const feedLink = `#/profile/${feed.creator.handle}/feed/${feed.uri.split('/').pop()}`;

    const handleTogglePin = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onTogglePin();
    };

    return (
        <a href={feedLink} className="block p-3 bg-surface-2 rounded-xl hover:bg-surface-3 transition-colors">
            <div className="flex items-start gap-3">
                <FeedAvatar src={feed.avatar} alt={feed.displayName} className="w-12 h-12 rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="min-w-0">
                            <h3 className="font-bold truncate">{feed.displayName}</h3>
                            <p className="text-sm text-on-surface-variant">{t('feeds.byline', { handle: feed.creator.handle })}</p>
                        </div>
                        {session && (
                             <button 
                                onClick={handleTogglePin}
                                className={`font-semibold text-sm py-1.5 px-4 rounded-full transition-colors duration-200 flex-shrink-0
                                    ${isPinned
                                    ? 'bg-surface-3 text-on-surface hover:bg-surface-3/80'
                                    : 'bg-primary text-on-primary hover:bg-primary/90'
                                    }
                                `}
                            >
                                {isPinned ? t('feeds.unpinAction') : t('feeds.pinAction')}
                            </button>
                        )}
                    </div>
                    {feed.description && <p className="text-sm mt-1 text-on-surface line-clamp-2">{feed.description.replace(/\n/g, ' ')}</p>}
                </div>
            </div>
        </a>
    );
};

export default React.memo(FeedSearchResultCard);