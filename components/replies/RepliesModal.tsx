import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs } from '@atproto/api';
import { X } from 'lucide-react';
import { theme } from '@/lib/theme';
import Reply from '@/components/post/Reply';
import PostScreenActionBar from '@/components/post/PostScreenActionBar';

interface RepliesModalProps {
  data: {
    post: AppBskyFeedDefs.PostView;
    thread: AppBskyFeedDefs.ThreadViewPost;
  };
  onClose: () => void;
}

const RepliesModal: React.FC<RepliesModalProps> = ({ data, onClose }) => {
  const { post, thread } = data;
  const { t } = useTranslation();

  const replies = thread.replies?.filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[] || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.dragHandle} />
        <Text style={styles.headerTitle}>{t('common.replies', { count: post.replyCount || 0 })}</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <X color={theme.colors.onSurface} />
        </Pressable>
      </View>
      
      <FlatList
        data={replies}
        renderItem={({ item }) => <Reply reply={item} />}
        keyExtractor={(item) => item.post.cid}
        contentContainerStyle={styles.listContentContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.messageContainer}>
            <Text style={styles.infoText}>{t('post.noReplies')}</Text>
          </View>
        )}
      />

      <PostScreenActionBar post={post} />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surfaceContainer,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
        position: 'relative',
    },
    dragHandle: {
        position: 'absolute',
        top: theme.spacing.s,
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.outline,
    },
    headerTitle: {
        ...theme.typography.titleMedium,
        color: theme.colors.onSurface,
        textAlign: 'center',
        paddingTop: theme.spacing.s,
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing.l,
        top: '50%',
        marginTop: 4, // Adjust for drag handle space
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
    },
    infoText: {
        ...theme.typography.bodyLarge,
        color: theme.colors.onSurfaceVariant,
    },
});

export default RepliesModal;
