
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/components/shared';
import { useAuthGuard } from '@/hooks/useAuthGuard';

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
  const { requireAuth } = useAuthGuard();
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const styles = createStyles(theme);

  const handleFollowingClick = () => {
    if (!session) {
      openLoginModal();
      return;
    }
    onSelectFeed('following');
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

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        paddingVertical: theme.spacing.md,
    },
    scrollContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
    },
    tab: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surfaceContainer,
    },
    tabActive: {
        backgroundColor: theme.colors.primary,
    },
    tabText: {
        fontSize: theme.typography.titleSmall.fontSize,
        fontWeight: '500',
        color: theme.colors.onSurface,
    },
    tabTextActive: {
        fontWeight: '700',
        color: theme.colors.background,
    },
    skeleton: {
        height: 38,
        width: 96,
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.radius.full,
    }
});

export default FeedSelector;