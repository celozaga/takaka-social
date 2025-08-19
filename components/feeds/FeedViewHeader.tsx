
import React from 'react';
import { useUI } from '../../context/UIContext';
import { useFeedActions } from '../../hooks/useFeedActions';
import { ArrowLeft, MoreHorizontal, Heart } from 'lucide-react';
import FeedAvatar from '../FeedAvatar';

interface FeedViewHeaderProps {
    feedUri: string;
    onBack: () => void;
}

const FeedViewHeader: React.FC<FeedViewHeaderProps> = ({ feedUri, onBack }) => {
    const { openFeedModal } = useUI();
    const { feedView, isLoading, likeCount } = useFeedActions(feedUri);

    if (isLoading) {
        return (
            <div className="sticky top-0 -mx-4 px-4 bg-surface-1 z-30 animate-pulse">
                <div className="flex items-center justify-between h-16">
                    <div className="h-8 w-3/4 bg-surface-3 rounded-md"></div>
                    <div className="h-8 w-8 bg-surface-3 rounded-full"></div>
                </div>
            </div>
        )
    }

    if (!feedView) {
        return (
             <div className="sticky top-0 -mx-4 px-4 bg-surface-1 z-30">
                <div className="flex items-center justify-between h-16">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-surface-3">
                        <ArrowLeft size={20} />
                    </button>
                    <p className="text-sm text-error">Could not load feed</p>
                    <div className="w-8"></div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="sticky top-0 -mx-4 px-4 bg-surface-1 z-30">
            <div className="flex items-center justify-between h-16">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-surface-3">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2 font-bold truncate">
                    <FeedAvatar src={feedView.avatar} alt="" className="w-7 h-7 rounded-md" />
                    <span className="truncate">{feedView.displayName}</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 text-on-surface-variant text-sm">
                        <Heart size={16} className="text-like" />
                        <span>{likeCount}</span>
                    </div>
                    <button onClick={() => openFeedModal(feedUri)} className="p-2 rounded-full hover:bg-surface-3">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedViewHeader;