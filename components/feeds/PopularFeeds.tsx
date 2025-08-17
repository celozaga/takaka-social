
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useSavedFeeds } from '../../hooks/useSavedFeeds';
import { AppBskyFeedDefs } from '@atproto/api';
import { Search } from 'lucide-react';
import FeedSearchResultCard from './FeedSearchResultCard';


// --- Main PopularFeeds Component ---
interface PopularFeedsProps {
  showHeader?: boolean;
}

const PopularFeeds: React.FC<PopularFeedsProps> = ({ showHeader = true }) => {
    const { agent } = useAtp();
    const [feeds, setFeeds] = useState<AppBskyFeedDefs.GeneratorView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { pinnedUris, togglePin, addFeed } = useSavedFeeds();
    
    useEffect(() => {
        const fetchFeeds = async () => {
            setIsLoading(true);
            try {
                // This is an unspecced API but widely used by clients.
                const response = await (agent.api.app.bsky.unspecced as any).getPopularFeedGenerators({ limit: 15 });
                setFeeds(response.data.feeds);
            } catch (error) {
                console.error("Failed to fetch popular feeds:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeeds();
    }, [agent]);

    const handlePinToggle = (feed: AppBskyFeedDefs.GeneratorView) => {
        const isPinned = pinnedUris.has(feed.uri);
        if (isPinned) {
            togglePin(feed.uri); // This will just unpin
        } else {
            addFeed(feed, true); // This will save and pin
        }
    }
    
    return (
        <div>
            {showHeader && (
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-xl font-bold">Popular Feeds</h2>
                    <a href="#/feeds" className="p-1 hover:bg-surface-3 rounded-full">
                        <Search className="w-5 h-5 text-on-surface-variant" />
                    </a>
                </div>
            )}
             {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-surface-2 rounded-xl p-3 h-[88px] animate-pulse"></div>
                    ))}
                </div>
             ) : (
                <div className="space-y-3">
                    {feeds.map(feed => (
                        <FeedSearchResultCard
                            key={feed.uri} 
                            feed={feed}
                            isPinned={pinnedUris.has(feed.uri)}
                            onTogglePin={() => handlePinToggle(feed)}
                        />
                    ))}
                </div>
             )}
        </div>
    );
};

export default PopularFeeds;
