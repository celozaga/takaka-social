


import React from 'react';
import { View, StyleSheet, FlatList, Text, Platform, useWindowDimensions, FlatListProps } from 'react-native';
import { AppBskyFeedDefs } from '@atproto/api';
import PostHeader from './PostHeader';
import FullPostCard from './FullPostCard';
import Reply from './Reply';
import PostScreenActionBar from './PostScreenActionBar';
import { useTranslation } from 'react-i18next';
import { theme } from '@/lib/theme';

interface PostScreenProps {
  thread: AppBskyFeedDefs.ThreadViewPost;
}

const PostScreen: React.FC<PostScreenProps> = ({ thread }) => {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const replies = thread.replies?.filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[] || [];

  const ListHeader = () => (
    <View>
      <FullPostCard feedViewPost={{ post: thread.post }} />
      {thread.post.replyCount > 0 && (
          <View style={styles.repliesHeader}>
              <Text style={styles.repliesHeaderText}>{t('common.replies', { count: thread.post.replyCount })}</Text>
          </View>
      )}
    </View>
  );

  const renderItem = ({ item }: { item: AppBskyFeedDefs.ThreadViewPost }) => (
    <Reply reply={item} />
  );
  
  const ListEmpty = () => {
      if(thread.post.replyCount === 0) {
          return (
            <View style={styles.messageContainer}>
              <Text style={styles.infoText}>{t('post.noReplies')}</Text>
            </View>
          )
      }
      return null;
  }
  
  const renderFooter = () => {
      // Show action bar in footer only on desktop web
      if (Platform.OS === 'web' && isDesktop) {
          return <PostScreenActionBar post={thread.post} />;
      }
      // On mobile web and native, it's rendered absolutely, so no footer needed.
      return null;
  }

  const flatListProps: FlatListProps<AppBskyFeedDefs.ThreadViewPost> = {
    data: replies,
    renderItem,
    keyExtractor: (item) => item.post.cid,
    ListHeaderComponent: ListHeader,
    ListEmptyComponent: ListEmpty,
    ListFooterComponent: renderFooter,
    contentContainerStyle: [
        styles.listContentContainer,
        // Add padding for the absolute action bar on mobile, but not desktop
        { paddingBottom: (Platform.OS === 'web' && isDesktop) ? theme.spacing.l : 80 }
    ],
    ItemSeparatorComponent: () => <View style={styles.separator} />,
  };

  return (
    <View style={styles.container}>
      <PostHeader post={thread.post} />
      <FlatList {...flatListProps} />
      {/* Render floating action bar on mobile (native and web) */}
      {!(Platform.OS === 'web' && isDesktop) && <PostScreenActionBar post={thread.post} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContentContainer: {
    padding: theme.spacing.l,
  },
  repliesHeader: {
    marginTop: theme.spacing.xl,
  },
  repliesHeaderText: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginVertical: theme.spacing.s,
  },
   messageContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.l,
  },
  infoText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center'
  },
});

export default PostScreen;