import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, Text } from 'react-native';
import { AppBskyFeedDefs } from '@atproto/api';
import PostHeader from './PostHeader';
import FullPostCard from './FullPostCard';
import PostScreenActionBar from './PostScreenActionBar';
import PostPageWebActionBar from './PostPageWebActionBar';
import RepliesList from '@/components/replies/RepliesList';
import { useTranslation } from 'react-i18next';
import { theme } from '@/lib/theme';

interface PostScreenProps {
  thread: AppBskyFeedDefs.ThreadViewPost;
}

const PostScreen: React.FC<PostScreenProps> = ({ thread }) => {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isWeb = Platform.OS === 'web';

  const ListHeader = () => (
    <View>
      <FullPostCard feedViewPost={{ post: thread.post }} />
      {isWeb && isDesktop && <PostPageWebActionBar post={thread.post} />}
      {thread.post.replyCount && thread.post.replyCount > 0 && (
        <View style={styles.repliesHeader}>
          <Text style={styles.repliesHeaderText}>
            {t('common.replies', { count: thread.post.replyCount })}
          </Text>
        </View>
      )}
    </View>
  );

  const contentContainerStyle = [
    // Add padding for the absolute action bar on mobile, but not desktop
    { paddingBottom: (isWeb && isDesktop) ? theme.spacing.l : 80 }
  ];

  return (
    <View style={styles.container}>
      <PostHeader post={thread.post} />
      <RepliesList 
        post={thread.post}
        thread={thread}
        showActionBar={!(isWeb && isDesktop)}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={ListHeader}
      />
      {/* Render floating action bar on mobile (native and web) */}
      {!(isWeb && isDesktop) && <PostScreenActionBar post={thread.post} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  repliesHeader: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.surfaceContainer,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  repliesHeaderText: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
});

export default PostScreen;
