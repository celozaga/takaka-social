
import React from 'react';
import { Link } from 'expo-router';
import { useAtp } from '../../context/AtpContext';
import { 
  AppBskyNotificationListNotifications, 
  AppBskyFeedPost, 
  AtUri, 
  AppBskyEmbedImages, 
  AppBskyEmbedRecord, 
  AppBskyEmbedRecordWithMedia 
} from '@atproto/api';
import { Heart, Repeat, MessageCircle, UserPlus, FileText, AtSign, BadgeCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';

interface NotificationItemProps {
  notification:AppBskyNotificationListNotifications.Notification;
}

const PostPreview: React.FC<{ record: Partial<AppBskyFeedPost.Record>, postUri: string }> = ({ record, postUri }) => {
    const { agent } = useAtp();
    
    const embed = record.embed;
    let mediaEmbed:AppBskyEmbedImages.Main | undefined;
    let recordEmbed: AppBskyEmbedRecord.Main | undefined;

    if (AppBskyEmbedImages.isMain(embed)) mediaEmbed = embed;
    else if (AppBskyEmbedRecord.isMain(embed)) recordEmbed = embed;
    else if (AppBskyEmbedRecordWithMedia.isMain(embed)) {
        recordEmbed = embed.record;
        if (AppBskyEmbedImages.isMain(embed.media)) mediaEmbed = embed.media;
    }

    const renderImage = () => {
        if (!mediaEmbed || mediaEmbed.images.length === 0) return null;
        const firstImage = mediaEmbed.images[0];
        const authorDid = new AtUri(postUri).hostname;
        const imageUrl = `${agent.service.toString()}/xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${firstImage.image.ref.toString()}`;
        return <Image source={{ uri: imageUrl }} style={styles.previewImage} />;
    };

    const imageElement = renderImage();
    const hasTextContent = record.text && record.text.trim().length > 0;
    const hasVisibleContent = hasTextContent || imageElement;

    return (
        <View style={styles.previewContainer}>
            {hasVisibleContent && (
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
            )}
            {recordEmbed && (
                <View style={[styles.quotedContainer, hasVisibleContent && { marginTop: 8 }]}>
                    <Text style={styles.quotedText}>Quoted from another post.</Text>
                </View>
            )}
        </View>
    );
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { reason, author, record, uri, isRead, indexedAt } = notification;

  let Icon: React.ReactNode;
  let reasonText: string = `New notification: ${reason}`;
  let link: string = '#';
  let content: React.ReactNode = null;

  const postUri = new AtUri(uri);
  const profileLink = `/profile/${author.handle}`;
  const postLink = `/post/${postUri.hostname}/${postUri.rkey}`;

  const AuthorLink = () => (
    <Link href={profileLink as any} onPress={e => e.stopPropagation()} asChild>
      <Pressable style={styles.authorLinkContainer}>
        <Text style={styles.authorLinkText}>{author.displayName || `@${author.handle}`}</Text>
        {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
            <BadgeCheck size={14} color="#A8C7FA" fill="#A8C7FA" style={{ flexShrink: 0, marginLeft: 2 }} />
        )}
      </Pressable>
    </Link>
  );

  switch (reason) {
    case 'like':
      Icon = <Heart color="#ec4899" size={24} />;
      reasonText = 'liked your post';
      link = postLink;
      if (AppBskyFeedPost.isRecord(record)) content = <PostPreview record={record} postUri={uri} />;
      break;
    case 'repost':
      Icon = <Repeat color="#A8C7FA" size={24} />;
      reasonText = 'reposted your post';
      link = postLink;
      if (AppBskyFeedPost.isRecord(record)) content = <PostPreview record={record} postUri={uri} />;
      break;
    case 'follow':
      Icon = <UserPlus color="#A8C7FA" size={24} />;
      reasonText = 'followed you';
      link = profileLink;
      break;
    case 'reply':
      Icon = <MessageCircle color="#A8C7FA" size={24} />;
      reasonText = 'replied to your post';
      link = postLink;
      if (AppBskyFeedPost.isRecord(record)) content = <PostPreview record={record} postUri={uri} />;
      break;
    case 'mention':
      Icon = <AtSign color="#A8C7FA" size={24} />;
      reasonText = 'mentioned you in a post';
      link = postLink;
      if (AppBskyFeedPost.isRecord(record)) content = <PostPreview record={record} postUri={uri} />;
      break;
    default:
      Icon = <FileText color="#C3C6CF" size={24} />;
  }
  
  const timeAgo = formatDistanceToNow(new Date(indexedAt), { addSuffix: true });

  return (
    <Link href={link as any} asChild>
        <Pressable style={[styles.container, !isRead && styles.unreadContainer]}>
            <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flexShrink: 0, width: 24, alignItems: 'center' }}>{Icon}</View>
                <View style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Image source={{ uri: author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                            <View style={styles.titleContainer}>
                                <AuthorLink />
                                <Text style={styles.titleText}> {reasonText}</Text>
                            </View>
                        </View>
                        <Text style={styles.timeAgo}>{timeAgo}</Text>
                    </View>
                    {content && <View style={{ marginTop: 4 }}>{content}</View>}
                </View>
            </View>
        </Pressable>
    </Link>
  );
};

const styles = StyleSheet.create({
    container: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginVertical: 4 },
    unreadContainer: { backgroundColor: 'rgba(168, 199, 250, 0.1)' },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flex: 1 },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2b2d2e' },
    titleContainer: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, alignItems: 'center' },
    titleText: { fontSize: 14, color: '#E2E2E6', lineHeight: 20 },
    authorLinkContainer: { flexDirection: 'row', alignItems: 'center' },
    authorLinkText: { fontWeight: 'bold', color: '#E2E2E6', fontSize: 14, lineHeight: 20 },
    timeAgo: { fontSize: 12, color: '#C3C6CF', flexShrink: 0, marginLeft: 8, paddingTop: 2 },
    previewContainer: { borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 8, marginTop: 8, backgroundColor: '#111314' },
    previewContent: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    previewImage: { width: 64, height: 64, borderRadius: 6, backgroundColor: '#2b2d2e' },
    previewText: { color: '#E2E2E6', fontSize: 14, flex: 1 },
    quotedContainer: { borderWidth: 1, borderColor: '#333', borderRadius: 6, padding: 8, backgroundColor: '#1E2021' },
    quotedText: { fontSize: 12, color: '#C3C6CF' },
});

export default React.memo(NotificationItem);
