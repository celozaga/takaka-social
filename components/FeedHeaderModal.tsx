import React from 'react';
import { useUI } from '../context/UIContext';
import { useFeedActions } from '../hooks/useFeedActions';
import { Heart, Pin, Share2, AlertCircle, X } from 'lucide-react';
import FeedAvatar from './FeedAvatar';

const FeedHeaderModal: React.FC = () => {
    const { feedModalUri, closeFeedModal } = useUI();
    const { 
        feedView, 
        isLoading, 
        error, 
        likeUri, 
        handleLike,
        isPinned,
        handlePinToggle,
        handleShare
    } = useFeedActions(feedModalUri);
    
    const ActionButton: React.FC<{ icon: React.FC<any>, text: string, onClick: () => void, isDestructive?: boolean, isActive?: boolean }> = 
    ({ icon: Icon, text, onClick, isDestructive = false, isActive = false }) => (
        <button
            onClick={onClick}
            className={`flex items-center justify-center gap-3 w-full py-3 rounded-lg transition-colors ${
                isDestructive 
                ? 'bg-surface-3 text-error hover:bg-error/20' 
                : isActive 
                ? 'bg-primary-container text-on-primary-container' 
                : 'bg-surface-3 hover:bg-surface-3/80'
            }`}
        >
            <Icon size={20} fill={isActive && !isDestructive ? 'currentColor' : 'none'}/>
            <span className="font-semibold">{text}</span>
        </button>
    );

    const renderContent = () => {
        if (isLoading) {
            return <div className="h-64 bg-surface-3 animate-pulse rounded-lg"></div>;
        }

        if (error || !feedView) {
            return <p className="text-center text-error p-4">{error || "Could not load feed details."}</p>;
        }

        return (
            <>
                <div className="relative p-4 flex flex-col items-center text-center">
                    <button onClick={closeFeedModal} className="absolute top-3 right-3 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-3 transition-colors z-10" aria-label="Close">
                        <X className="w-5 h-5" />
                    </button>
                     <button onClick={handleShare} className="absolute top-3 left-3 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-3 transition-colors z-10" aria-label="Share">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <FeedAvatar src={feedView.avatar} alt={feedView.displayName} className="w-20 h-20 rounded-lg mb-3" />
                    <h2 className="text-2xl font-bold">{feedView.displayName}</h2>
                    <p className="text-sm text-on-surface-variant">By @{feedView.creator.handle}</p>
                    <p className="text-sm text-on-surface-variant mt-2">
                        Liked by {feedView.likeCount || 0} users
                    </p>
                    {feedView.description && (
                        <p className="mt-3 text-on-surface text-base">{feedView.description}</p>
                    )}
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                    <ActionButton
                        icon={Heart}
                        text={likeUri ? "Unlike" : "Like"}
                        onClick={handleLike}
                        isActive={!!likeUri}
                    />
                     <ActionButton
                        icon={Pin}
                        text={isPinned ? "Unpin feed" : "Pin feed"}
                        onClick={handlePinToggle}
                    />
                </div>
                 <div className="p-4 pt-0">
                    <ActionButton
                        icon={AlertCircle}
                        text="Report feed"
                        onClick={() => alert("Report functionality not yet implemented.")}
                        isDestructive
                    />
                </div>
            </>
        )
    }

    return (
        <div className="bg-surface-2 rounded-xl">
            {renderContent()}
        </div>
    );
};

export default FeedHeaderModal;