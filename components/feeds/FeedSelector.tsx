
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

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
  const { t } = useTranslation();

  const handleFollowingClick = () => {
    if (session) {
      onSelectFeed('following');
    } else {
      openLoginModal();
    }
  };

  const FeedButton = ({ label, feedUri, isActive }: { label: string, feedUri: string, isActive: boolean }) => (
    <Pressable 
        onPress={() => feedUri === 'following' ? handleFollowingClick() : onSelectFeed(feedUri)}
        style={[styles.button, isActive ? styles.activeButton : styles.inactiveButton]}
    >
        <Text style={[styles.buttonText, isActive ? styles.activeButtonText : styles.inactiveButtonText]}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
    >
      <FeedButton 
        label={t('home.following')}
        feedUri='following'
        isActive={selectedFeed === 'following'}
      />
      
      {session && (
        <FeedButton 
          label={t('home.discover')}
          feedUri={DISCOVER_FEED_URI}
          isActive={selectedFeed === DISCOVER_FEED_URI}
        />
      )}

      {session && isLoading && [...Array(5)].map((_, i) => (
        <View key={i} style={styles.skeleton} />
      ))}
      
      {session && !isLoading && feeds.map(feed => (
        <FeedButton 
            key={feed.uri}
            label={feed.displayName}
            feedUri={feed.uri}
            isActive={selectedFeed === feed.uri}
        />
      ))}
      
      {!session && (
          <FeedButton
            label={t('home.discover')}
            feedUri={DISCOVER_FEED_URI}
            isActive={selectedFeed === DISCOVER_FEED_URI}
          />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 8,
    },
    button: {
        flexShrink: 0,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
    },
    activeButton: {
        backgroundColor: '#D1E4FF', // primary-container
    },
    inactiveButton: {
        backgroundColor: 'transparent',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    activeButtonText: {
        color: '#001D35', // on-primary-container
    },
    inactiveButtonText: {
        color: '#C3C6CF', // on-surface-variant
    },
    skeleton: {
        height: 36,
        width: 96,
        backgroundColor: '#1E2021', // surface-2
        borderRadius: 999,
        opacity: 0.5,
        flexShrink: 0,
    }
});

export default FeedSelector;