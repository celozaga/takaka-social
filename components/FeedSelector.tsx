
import React from 'react';
import { AppBskyFeedDefs } from '@atproto/api';
import { useAtp } from '../context/AtpContext';
import { useUI } from '../context/UIContext';

interface FeedSelectorProps {
  feeds: AppBskyFeedDefs.GeneratorView[];
  selectedFeed: string;
  onSelectFeed: (feedUri: string) => void;
  isLoading: boolean;
}

const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';

const FeedSelector: React.FC<FeedSelectorProps> = ({ feeds, selectedFeed, onSelectFeed, isLoading }) => {
  const { session } = useAtp();
  const { openLoginModal } = useUI();

  const baseClasses = "flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap";
  const activeClasses = "bg-primary-container text-on-primary-container";
  const inactiveClasses = "text-on-surface-variant hover:bg-surface-3";

  const handleFollowingClick = () => {
    if (session) {
      onSelectFeed('following');
    } else {
      openLoginModal();
    }
  };

  return (
    <div className="no-scrollbar -mx-4 px-4 flex items-center gap-2 overflow-x-auto pb-2 border-b border-surface-3">
      <button 
        onClick={handleFollowingClick}
        className={`${baseClasses} ${selectedFeed === 'following' ? activeClasses : inactiveClasses}`}
      >
        Following
      </button>
      
      {session && (
        <button 
          onClick={() => onSelectFeed(DISCOVER_FEED_URI)}
          className={`${baseClasses} ${selectedFeed === DISCOVER_FEED_URI ? activeClasses : inactiveClasses}`}
        >
          Discover
        </button>
      )}

      {session && isLoading && [...Array(5)].map((_, i) => (
        <div key={i} className="h-9 w-24 bg-surface-2 rounded-full animate-pulse flex-shrink-0"></div>
      ))}
      
      {session && !isLoading && feeds.map(feed => (
        <button 
          key={feed.uri}
          onClick={() => onSelectFeed(feed.uri)}
          className={`${baseClasses} ${selectedFeed === feed.uri ? activeClasses : inactiveClasses}`}
        >
          {feed.displayName}
        </button>
      ))}
      
      {!session && (
          <button 
            onClick={() => onSelectFeed(DISCOVER_FEED_URI)}
            className={`${baseClasses} ${selectedFeed === DISCOVER_FEED_URI ? activeClasses : inactiveClasses}`}
           >
            Discover
          </button>
      )}
    </div>
  );
};

// Simple utility to hide scrollbar but keep functionality
const styles = document.createElement('style');
styles.textContent = `
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.append(styles);

export default FeedSelector;
