import React from 'react';
import { View, StyleSheet, FlatList, Text, Platform } from 'react-native';
import { AppBskyFeedDefs } from '@atproto/api';
import ScreenHeader from '../layout/ScreenHeader';
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

  const replies = thread.replies?.filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[] || [];

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <FullPostCard feedViewPost={{ post: thread.post }} />
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
      if (Platform.OS === 'web') {
          return <PostScreenActionBar post={thread.post} />;
      }
      return null;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('common.post')} />
      <FlatList
        data={replies}
        renderItem={renderItem}
        keyExtractor={(item) => item.post.cid}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContentContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      {Platform.OS !== 'web' && <PostScreenActionBar post={thread.post} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    padding: theme.spacing.l,
    paddingTop: 0,
  },
  listContentContainer: {
    paddingBottom: Platform.select({ web: 0, default: 80 }), // Space for action bar on native
    paddingHorizontal: theme.spacing.l,
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