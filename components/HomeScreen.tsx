
import React, { useState, useEffect } from 'react';
import { useAtp } from '../context/AtpContext';
import { AppBskyFeedDefs, AppBskyActorDefs } from '@atproto/api';
import Timeline from './Timeline';
import FeedSelector from './FeedSelector';

const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';

const HomeScreen: React.FC = () => {
  const { agent, session } = useAtp();
  const [feeds, setFeeds] = useState<AppBskyFeedDefs.GeneratorView[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<string>(session ? 'following' : DISCOVER_FEED_URI);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);

  useEffect(() => {
    if (!session) {
      setSelectedFeed(DISCOVER_FEED_URI);
      setIsLoadingFeeds(false);
      setFeeds([]);
      return;
    }

    const fetchFeeds = async () => {
      setIsLoadingFeeds(true);
      try {
        // Fetch preferences and the discover feed generator in parallel for speed
        const prefsPromise = agent.app.bsky.actor.getPreferences();
        const discoverFeedPromise = agent.app.bsky.feed.getFeedGenerator({ feed: DISCOVER_FEED_URI });

        const [prefsResult, discoverFeedResult] = await Promise.all([prefsPromise, discoverFeedPromise]);
        
        const discoverFeedView = discoverFeedResult.data.view;

        const savedFeedsPref = prefsResult.data.preferences.find(
          (pref) =>
            pref.$type === 'app.bsky.actor.defs#savedFeedsPrefV2' || pref.$type === 'app.bsky.actor.defs#savedFeedsPref'
        );
        
        let pinnedFeedUris: string[] = [];
        if (savedFeedsPref) {
            if (AppBskyActorDefs.isSavedFeedsPrefV2(savedFeedsPref)) {
                pinnedFeedUris = savedFeedsPref.items
                    .filter(item => item.type === 'feed' && item.pinned)
                    .map(item => item.value);
            } else if (AppBskyActorDefs.isSavedFeedsPref(savedFeedsPref)) {
                pinnedFeedUris = savedFeedsPref.pinned || [];
            }
        }
        
        const otherPinnedUris = pinnedFeedUris.filter(uri => uri !== DISCOVER_FEED_URI);
        let finalFeeds: AppBskyFeedDefs.GeneratorView[] = [discoverFeedView];

        if (otherPinnedUris.length > 0) {
            const { data } = await agent.app.bsky.feed.getFeedGenerators({
                feeds: otherPinnedUris,
            });
            // Combine feeds, with Discover always first, followed by other pinned feeds
            finalFeeds = [discoverFeedView, ...data.feeds];
        }
        
        setFeeds(finalFeeds);

      } catch (error) {
        console.error("Failed to fetch feeds:", error);
      } finally {
        setIsLoadingFeeds(false);
      }
    };
    fetchFeeds();
  }, [agent, session]);
  
  // Effect to switch to 'following' when user logs in.
  useEffect(() => {
    if (session) {
      setSelectedFeed('following');
    } else {
      setSelectedFeed(DISCOVER_FEED_URI);
    }
  }, [session]);

  return (
    <div>
      <FeedSelector
        feeds={feeds}
        selectedFeed={selectedFeed}
        onSelectFeed={setSelectedFeed}
        isLoading={isLoadingFeeds}
      />
      <div className="mt-4">
        <Timeline key={selectedFeed} feedUri={selectedFeed} />
      </div>
    </div>
  );
};

export default HomeScreen;
