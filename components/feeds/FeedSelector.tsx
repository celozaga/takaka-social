import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import theme from '@/lib/theme';

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

  const Tab: React.FC<{ label: string; feedUri: string; isActive: boolean }> = ({ label, feedUri, isActive }) => (
    <Pressable 
        onPress={() => feedUri === 'following' ? handleFollowingClick() : onSelectFeed(feedUri)}
        style={[styles.tab, isActive && styles.tabActive]}
    >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
        >
        <Tab 
            label={t('home.following')}
            feedUri='following'
            isActive={selectedFeed === 'following'}
        />
        
        <Tab 
            label={t('home.discover')}
            feedUri={DISCOVER_FEED_URI}
            isActive={selectedFeed === DISCOVER_FEED_URI}
        />

        {isLoading && [...Array(3)].map((_, i) => (
            <View key={i} style={styles.skeleton} />
        ))}
        
        {session && !isLoading && feeds.map(feed => (
            <Tab 
                key={feed.uri}
                label={feed.displayName}
                feedUri={feed.uri}
                isActive={selectedFeed === feed.uri}
            />
        ))}
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceContainerHigh,
        backgroundColor: theme.colors.surface,
    },
    scrollContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.l,
        paddingHorizontal: theme.spacing.l,
    },
    tab: {
        paddingVertical: theme.spacing.l,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        ...theme.typography.titleSmall,
        color: theme.colors.onSurfaceVariant,
    },
    tabTextActive: {
        color: theme.colors.primary,
    },
    skeleton: {
        height: 20,
        width: 96,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.small,
        marginVertical: theme.spacing.l,
    }
});

export default FeedSelector;