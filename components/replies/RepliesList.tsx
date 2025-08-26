import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs } from '@atproto/api';
import { theme } from '@/lib/theme';
import Reply from '@/components/post/Reply';
import PostScreenActionBar from '@/components/post/PostScreenActionBar';

interface RepliesListProps {
  post: AppBskyFeedDefs.PostView;
  thread: AppBskyFeedDefs.ThreadViewPost;
  showActionBar?: boolean;
  contentContainerStyle?: any;
  onReplyPress?: () => void;
  ListHeaderComponent?: React.ComponentType<any>;
}

const RepliesList: React.FC<RepliesListProps> = ({ 
  post, 
  thread, 
  showActionBar = true,
  contentContainerStyle,
  onReplyPress,
  ListHeaderComponent
}) => {
  const { t } = useTranslation();
  const replies = thread.replies?.filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[] || [];

  const DefaultListHeader = () => (
    <View style={styles.repliesHeader}>
      <Text style={styles.repliesHeaderText}>
        {t('common.replies', { count: post.replyCount || 0 })}
      </Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.messageContainer}>
      <Text style={styles.infoText}>{t('post.noReplies')}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: AppBskyFeedDefs.ThreadViewPost }) => (
    <Reply reply={item} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={replies}
        renderItem={renderItem}
        keyExtractor={(item) => item.post.cid}
        ListHeaderComponent={ListHeaderComponent || DefaultListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContentContainer,
          contentContainerStyle
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
      
      {showActionBar && (
        <PostScreenActionBar post={post} onReplyPress={onReplyPress} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  repliesHeader: {
    marginBottom: theme.spacing.l,
  },
  repliesHeaderText: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurface,
  },
  listContentContainer: {
    padding: theme.spacing.l,
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
  },
  infoText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default RepliesList;
