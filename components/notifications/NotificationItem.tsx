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
import { View, Text, Image, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';

interface NotificationItemProps {
  notification:AppBskyNotificationListNotifications.Notification;
}

const PostPreview: React.FC<{ record: Partial<AppBskyFeedPost.Record>, postUri: string }> = ({ record, postUri }) => {
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
        return <Image source={{ uri: imageUrl.toString() }} style={styles.previewImage} />;
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
      router.push(profileLink);
      return;
    }

    setIsNavigating(true);
    try {
      const res = await agent.getPosts({ uris: [uri] });
      if (res.data.posts[0]) {
        setPostForNav({ post: res.data.posts[0] });
        router.push(postLink);
      } else {
        // Fallback or show error
        router.push(postLink);
      }
    } catch (e) {
      console.error("Failed to fetch post for navigation:", e);
      // Fallback to direct navigation even if pre-fetch fails
      router.push(postLink);
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
    <Pressable onPress={handlePress} style={[styles.container, !isRead && styles.unreadContainer]}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flexShrink: 0, width: 32, alignItems: 'center' }}>
            <Image source={{ uri: author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
          </View>
          <View style={{ flex: 1 }}>
              <View style={styles.header}>
                  <View style={styles.titleContainer}>
                      <Text style={styles.titleText} numberOfLines={2}><AuthorLink /> {reasonText}</Text>
                  </View>
                  <Text style={styles.timeAgo}>{timeAgo}</Text>
              </View>
              {content && <View style={{ marginTop: 4 }}>{content}</View>}
              {isNavigating && <View style={styles.navigatingOverlay}><ActivityIndicator /></View>}
          </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 16, paddingVertical: 12 },
    unreadContainer: { backgroundColor: 'transparent' },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flex: 1 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceContainerHigh },
    titleContainer: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, alignItems: 'center' },
    titleText: { fontSize: 14, color: theme.colors.onSurface, lineHeight: 20 },
    authorLinkContainer: { flexDirection: 'row', alignItems: 'center' },
    authorLinkText: { fontWeight: 'bold', color: theme.colors.onSurface, fontSize: 14, lineHeight: 20 },
    timeAgo: { fontSize: 12, color: theme.colors.onSurfaceVariant, flexShrink: 0, marginLeft: 8, paddingTop: 2 },
    previewContainer: { borderRadius: 8, padding: 8, marginTop: 8, backgroundColor: theme.colors.surfaceContainerHigh },
    previewContent: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    previewImage: { width: 48, height: 48, borderRadius: 6, backgroundColor: theme.colors.surfaceContainerHighest },
    previewText: { color: theme.colors.onSurface, fontSize: 14, flex: 1 },
    navigatingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    }
});

export default React.memo(NotificationItem);