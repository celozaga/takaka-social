import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyActorDefs } from '@atproto/api';
import Feed from '../shared/Feed';
import FeedSelector from '../feeds/FeedSelector';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/components/shared';
import HomeHeader from './HomeHeader';

const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot'; // Assuming this height

const HomeScreen: React.FC = () => {
  const { agent, session, isLoadingSession } = useAtp();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [feeds, setFeeds] = useState<AppBskyFeedDefs.GeneratorView[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<string>(session ? 'following' : DISCOVER_FEED_URI);
  
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);

  // Removed scroll animations to fix infinite scroll conflict

  useEffect(() => {
    if (isLoadingSession || (session && !agent.hasSession)) {
      console.log('🏠 DEBUG: Waiting for session/agent readiness before fetching feeds');
      return;
    }
    console.log('🏠 DEBUG HomeScreen useEffect: session changed:', !!session);
    if (!session) {
      console.log('🏠 DEBUG: No session, setting Discovery feed');
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
  }, [agent, session, isLoadingSession, agent.hasSession]);
  
  useEffect(() => {
    console.log('🏠 DEBUG Second useEffect: session:', !!session, 'currentFeed:', selectedFeed);
    if (session) {
      if (selectedFeed === DISCOVER_FEED_URI) {
        console.log('🏠 DEBUG: User logged in, switching from Discovery to Following');
        setSelectedFeed('following');
      }
    } else {
      console.log('🏠 DEBUG: No session, ensuring Discovery feed is selected');
      setSelectedFeed(DISCOVER_FEED_URI);
    }
  }, [session, isLoadingSession, agent.hasSession]);

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HomeHeader />
      </View>
      <View style={styles.feedSelectorContainer}>
        <FeedSelector
          feeds={feeds}
          selectedFeed={selectedFeed}
          onSelectFeed={setSelectedFeed}
          isLoading={isLoadingFeeds}
        />
      </View>
      <View style={styles.feedContainer}>
        <Feed key={selectedFeed} feedUri={selectedFeed} />
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  feedContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.background,
  },
  feedSelectorContainer: {
    backgroundColor: theme.colors.background,
  }
});

export default HomeScreen;