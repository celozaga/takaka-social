import React, { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { 
  AppBskyNotificationListNotifications, 
  AppBskyFeedPost, 
  AtUri, 
  AppBskyEmbedImages, 
  AppBskyEmbedRecord, 
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs
} from '@atproto/api';
import { Heart, Repeat, MessageCircle, UserPlus, FileText, AtSign, BadgeCheck } from 'lucide-react';
import { formatCompactDate } from '@/lib/formatters';
import RichTextRenderer from '../shared/RichTextRenderer';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { OptimizedImage } from '../ui';
import { useTheme } from '@/components/shared';

interface NotificationItemProps {
  notification:AppBskyNotificationListNotifications.Notification;
}

const PostPreview: React.FC<{ record: Partial<AppBskyFeedPost.Record>, postUri: string }> = ({ record, postUri }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
    const { agent } = useAtp();
    
    const embed = record.embed;
    let mediaEmbed:AppBskyEmbedImages.Main | undefined;

    if (AppBskyEmbedImages.isMain(embed)) {
      mediaEmbed = embed;
    } else if (AppBskyEmbedRecordWithMedia.isMain(embed)) {
        const recordWithMediaEmbed = embed;
        if (AppBskyEmbedImages.isMain(recordWithMediaEmbed.media)) {
            mediaEmbed = recordWithMediaEmbed.media;
        }
    }

    const renderImage = () => {
        if (!mediaEmbed || mediaEmbed.images.length === 0) return null;
        const firstImage = mediaEmbed.images[0];
        const authorDid = new AtUri(postUri).hostname;
        const imageUrl = new URL('xrpc/com.atproto.sync.getBlob', agent.service.toString());
        imageUrl.searchParams.set('did', authorDid);
        imageUrl.searchParams.set('cid', firstImage.image.ref.toString());
        return <OptimizedImage source={{ uri: imageUrl.toString() }} style={styles.previewImage} />;
    };

    const imageElement = renderImage();
    const hasTextContent = record.text && record.text.trim().length > 0;
    const hasVisibleContent = hasTextContent || imageElement;
    
    if (!hasVisibleContent) return null;

    return (
        <View style={styles.previewContainer}>
            <View style={styles.previewContent}>
                {imageElement}
                {hasTextContent && (
                     <View style={{ flex: 1 }}>
                        <Text style={styles.previewText} numberOfLines={4}>
                            <RichTextRenderer record={{ text: record.text!, facets: record.facets }} />
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { reason, author, record, uri, isRead, indexedAt } = notification;
  const { agent } = useAtp();
  const { setPostForNav } = useUI();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  let Icon: React.ReactNode;
  let reasonText: string = `New notification: ${reason}`;
  let isPostLink = false;
  let content: React.ReactNode = null;

  const postUri = new AtUri(uri);
  const profileLink = `/profile/${author.handle}`;
  const postLink = `/post/${postUri.hostname}/${postUri.rkey}`;

  const handlePress = async () => {
    if (isNavigating) return;

    if (!isPostLink) {
      router.push(profileLink as any);
      return;
    }

    setIsNavigating(true);
    try {
      const res = await agent.getPosts({ uris: [uri] });
              if (res.data.posts[0]) {
          setPostForNav({ post: res.data.posts[0] });
          router.push(postLink as any);
        } else {
          // Fallback or show error
          router.push(postLink as any);
        }
    } catch (e) {
      console.error("Failed to fetch post for navigation:", e);
      // Fallback to direct navigation even if pre-fetch fails
      router.push(postLink as any);
    } finally {
      setIsNavigating(false);
    }
  };


  const AuthorLink = () => (
    <Link href={profileLink as any} onPress={e => e.stopPropagation()} asChild>
      <Pressable style={styles.authorLinkContainer}>
        <Text style={styles.authorLinkText}>{author.displayName || `@${author.handle}`}</Text>
        {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
            <BadgeCheck size={14} color={theme.colors.onSurface} fill={theme.colors.onSurface} style={{ flexShrink: 0, marginLeft: 2 }} />
        )}
      </Pressable>
    </Link>
  );

  switch (reason) {
    case 'like':
      Icon = <Heart color="#FFFFFF" size={24} />;
      reasonText = 'liked your post';
      isPostLink = true;
      if (AppBskyFeedPost.isRecord(record)) content = <PostPreview record={record} postUri={uri} />;
      break;
    case 'repost':
      Icon = <Repeat color="#FFFFFF" size={24} />;
      reasonText = 'reposted your post';
      isPostLink = true;
      if (AppBskyFeedPost.isRecord(record)) content = <PostPreview record={record} postUri={uri} />;
      break;
    case 'follow':
      Icon = <UserPlus color="#FFFFFF" size={24} />;
      reasonText = 'followed you';
      isPostLink = false;
      break;
    case 'reply':
      Icon = <MessageCircle color="#FFFFFF" size={24} />;
      reasonText = 'replied to your post';
      isPostLink = true;
      if (AppBskyFeedPost.isRecord(record)) content = <PostPreview record={record} postUri={uri} />;
      break;
    case 'mention':
      Icon = <AtSign color="#FFFFFF" size={24} />;
      reasonText = 'mentioned you in a post';
      isPostLink = true;
      if (AppBskyFeedPost.isRecord(record)) content = <PostPreview record={record} postUri={uri} />;
      break;
    default:
      Icon = <FileText color={theme.colors.onSurfaceVariant} size={24} />;
  }
  
  const timeAgo = formatCompactDate(indexedAt);

  return (
    <Pressable onPress={handlePress} style={[styles.container, !isRead && styles.unread]}>
      {isNavigating && (
        <View style={{...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1}}>
          <ActivityIndicator color="white" />
        </View>
      )}
      <View style={{ flexShrink: 0, width: 32, height: 40, position: 'relative' }}>
        <OptimizedImage source={{ uri: author.avatar }} style={styles.avatar} />
        <View style={[styles.iconContainer,
            reason === 'like' && styles.iconBackgroundLike,
            reason === 'repost' && styles.iconBackgroundRepost,
            reason === 'follow' && styles.iconBackgroundFollow,
            reason === 'reply' && styles.iconBackgroundReply,
            reason === 'mention' && styles.iconBackgroundMention,
        ]}>
            {Icon}
        </View>
      </View>
      <View style={styles.mainContent}>
        <View style={styles.textContainer}>
            <AuthorLink />
            <Text style={styles.reasonText}>
                {reasonText}
            </Text>
            <Text style={styles.timeAgo}>· {timeAgo}</Text>
        </View>
        
        {content && <View style={styles.postContent}>{content}</View>}

      </View>
    </Pressable>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        gap: 16,
        backgroundColor: theme.colors.background,
    },
    unread: {
        backgroundColor: theme.colors.surfaceContainer,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.full,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2,
    },
    iconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        right: 0,
        zIndex: 3,
        borderWidth: 2,
        borderColor: theme.colors.background
    },
    iconBackgroundLike: { backgroundColor: theme.colors.pink },
    iconBackgroundRepost: { backgroundColor: theme.colors.primary },
    iconBackgroundFollow: { backgroundColor: theme.colors.primary },
    iconBackgroundReply: { backgroundColor: theme.colors.onSurfaceVariant },
    iconBackgroundMention: { backgroundColor: theme.colors.onSurfaceVariant },
    mainContent: {
        flex: 1,
    },
    textContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    reasonText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
        lineHeight: 20,
    },
    authorLinkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorLinkText: {
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        fontSize: 14,
    },
    timeAgo: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
    },
    postContent: {
        marginTop: 8,
    },
    previewContainer: {
        borderWidth: 1,
        borderColor: theme.colors.outline,
        borderRadius: 8,
        marginTop: 8,
        overflow: 'hidden',
    },
    previewContent: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        padding: 8,
        backgroundColor: theme.colors.surfaceContainer,
    },
    previewImage: {
        width: 48,
        height: 48,
        borderRadius: 6,
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    previewText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
        flex: 1,
    },
});

export default NotificationItem;