import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { AppBskyEmbedRecord, AtUri, RichText, AppBskyFeedDefs } from '@atproto/api';
import RichTextRenderer from '../shared/RichTextRenderer';
import { formatDistanceToNowStrict } from 'date-fns';
import { theme } from '@/lib/theme';

interface QuotedPostProps {
  embed: AppBskyEmbedRecord.View;
}

const QuotedPost: React.FC<QuotedPostProps> = ({ embed }) => {
  if (AppBskyEmbedRecord.isViewNotFound(embed)) {
    return (
      <View style={[styles.container, styles.containerNotFound]}>
        <Text style={styles.notFoundText}>Quoted post not found</Text>
      </View>
    );
  }

  if (AppBskyEmbedRecord.isViewBlocked(embed)) {
    return (
      <View style={[styles.container, styles.containerBlocked]}>
        <Text style={styles.blockedText}>You have blocked the author of this post</Text>
      </View>
    );
  }

  if (!AppBskyEmbedRecord.isViewRecord(embed) || !AppBskyFeedDefs.isPostView(embed.record)) {
    return null; // Don't render if it's not a valid record view or not a post
  }

  const { record } = embed;
  const author = record.author;
  const postRecord = record.record as { text: string, createdAt: string, facets?: any[] };
  const postUri = new AtUri(record.uri);
  const postLink = `/post/${postUri.hostname}/${postUri.rkey}`;
  const timeAgo = formatDistanceToNowStrict(new Date(postRecord.createdAt), { addSuffix: true });

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: author.avatar }} style={styles.avatar} />
        <Text style={styles.authorName} numberOfLines={1}>{author.displayName || `@${author.handle}`}</Text>
        <Text style={styles.timeAgo}>· {timeAgo}</Text>
      </View>
      {postRecord.text && (
        <Text style={styles.postText} numberOfLines={4}>
          <RichTextRenderer record={postRecord} />
        </Text>
      )}
    </View>
  );

  return (
    <Link href={postLink as any} asChild>
      <Pressable>{content}</Pressable>
    </Link>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.shape.medium,
    padding: theme.spacing.m,
    marginTop: theme.spacing.s,
  },
  containerNotFound: {
    backgroundColor: theme.colors.surfaceContainer,
  },
  containerBlocked: {
    backgroundColor: theme.colors.surfaceContainer,
  },
  notFoundText: {
    color: theme.colors.onSurfaceVariant,
  },
  blockedText: {
    color: theme.colors.onSurfaceVariant,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.xs,
  },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: theme.shape.full,
  },
  authorName: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  timeAgo: {
    ...theme.typography.labelSmall,
    color: theme.colors.onSurfaceVariant,
  },
  postText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
  },
});

export default QuotedPost;