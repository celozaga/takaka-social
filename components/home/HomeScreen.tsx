import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyActorDefs } from '@atproto/api';
import Timeline from '../shared/Timeline';
import FeedSelector from '../feeds/FeedSelector';
import Head from '../shared/Head';

const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';

const HomeScreen: React.FC = () => {
  const { agent, session } = useAtp();
  const { t } = useTranslation();
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
        const prefsResult = await agent.app.bsky.actor.getPreferences();
        
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

        if (otherPinnedUris.length > 0) {
            const { data } = await agent.app.bsky.feed.getFeedGenerators({
                feeds: otherPinnedUris,
            });
            setFeeds(data.feeds);
        } else {
            setFeeds([]);
        }

      } catch (error) {
        console.error("Failed to fetch feeds:", error);
      } finally {
        setIsLoadingFeeds(false);
      }
    };
    fetchFeeds();
  }, [agent, session]);
  
  // Effect to switch feed only when session status changes (login/logout).
  // Removed `selectedFeed` from dependencies to prevent it from resetting user selection.
  useEffect(() => {
    if (session) {
      // Switch to 'following' only if the user was previously logged out
      // and on the default discover feed. This avoids overriding their selection
      // if they navigate away and back.
      if (selectedFeed === DISCOVER_FEED_URI) {
        setSelectedFeed('following');
      }
    } else {
      // If user logs out, switch to the public discover feed.
      setSelectedFeed(DISCOVER_FEED_URI);
    }
  }, [session]);

  return (
    <>
      <Head><title>{t('nav.home')}</title></Head>
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
    </>
  );
};

export default HomeScreen;