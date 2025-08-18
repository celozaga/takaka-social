

import React from 'react';
import { useAtp } from '../../context/AtpContext';
import { 
  AppBskyNotificationListNotifications, 
  AppBskyFeedPost, 
  AtUri, 
  AppBskyEmbedImages, 
  AppBskyEmbedRecord, 
  AppBskyEmbedRecordWithMedia 
} from '@atproto/api';
import { Heart, Repeat, MessageCircle, UserPlus, FileText, AtSign, BadgeCheck, Quote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';

interface NotificationItemProps {
  notification: AppBskyNotificationListNotifications.Notification;
}

const PostPreview: React.FC<{ record: Partial<AppBskyFeedPost.Record>, postUri: string }> = ({ record, postUri }) => {
    const { agent } = useAtp();
    
    const embed = record.embed;
    let mediaEmbed: AppBskyEmbedImages.Main | undefined;
    let recordEmbed: AppBskyEmbedRecord.Main | undefined;

    if (AppBskyEmbedImages.isMain(embed)) {
        mediaEmbed = embed;
    } else if (AppBskyEmbedRecord.isMain(embed)) {
        recordEmbed = embed;
    } else if (AppBskyEmbedRecordWithMedia.isMain(embed)) {
        recordEmbed = embed.record;
        if (AppBskyEmbedImages.isMain(embed.media)) {
            mediaEmbed = embed.media;
        }
    }

    const renderImage = () => {
        if (!mediaEmbed || mediaEmbed.images.length === 0) return null;
        const firstImage = mediaEmbed.images[0];
        const authorDid = new AtUri(postUri).hostname;
        const imageUrl = `${agent.service.toString()}/xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${firstImage.image.ref.toString()}`;
        
        return (
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-md bg-surface-3">
                <img src={imageUrl} className="w-full h-full object-cover" loading="lazy"/>
            </div>
        );
    };

    const imageElement = renderImage();
    const hasTextContent = record.text && record.text.trim().length > 0;
    const hasVisibleContent = hasTextContent || imageElement;

    return (
        <div className="border border-outline rounded-lg p-2 mt-2 bg-surface-1">
            {hasVisibleContent && (
                <div className="flex gap-3 items-center">
                    {imageElement}
                    {hasTextContent && (
                         <div className="text-on-surface whitespace-pre-wrap break-words text-sm line-clamp-4 flex-1">
                            <RichTextRenderer record={{ text: record.text!, facets: record.facets }} />
                        </div>
                    )}
                </div>
            )}
            {recordEmbed && (
                <div className={`text-xs text-on-surface-variant border border-outline rounded p-2 bg-surface-2 ${hasVisibleContent ? 'mt-2' : ''}`}>
                    Quoted from another post.
                </div>
            )}
        </div>
    );
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { reason, author, record, uri, isRead, indexedAt } = notification;

  let Icon: React.ReactNode;
  let title: React.ReactNode;
  let link: string;
  let content: React.ReactNode = null;

  const postUri = new AtUri(uri);
  const profileLink = `#/profile/${author.handle}`;
  const postLink = `#/post/${postUri.hostname}/${postUri.rkey}`;

  const AuthorLink = () => (
    <a href={profileLink} className="font-bold hover:underline inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <span>{author.displayName || `@${author.handle}`}</span>
      {author.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
        <BadgeCheck size={14} className="text-primary flex-shrink-0" fill="currentColor" />
      )}
    </a>
  );

  switch (reason) {
    case 'like':
      Icon = <Heart className="w-6 h-6 text-pink-500" />;
      title = <p><AuthorLink /> liked your post</p>;
      link = postLink;
      if (AppBskyFeedPost.isRecord(record)) {
        content = <PostPreview record={record} postUri={uri} />;
      }
      break;

    case 'repost':
      Icon = <Repeat className="w-6 h-6 text-primary" />;
      title = <p><AuthorLink /> reposted your post</p>;
      link = postLink;
      if (AppBskyFeedPost.isRecord(record)) {
        content = <PostPreview record={record} postUri={uri} />;
      }
      break;

    case 'follow':
      Icon = <UserPlus className="w-6 h-6 text-primary" />;
      title = <p><AuthorLink /> followed you</p>;
      link = profileLink;
      break;

    case 'reply':
      Icon = <MessageCircle className="w-6 h-6 text-primary" />;
      title = <p><AuthorLink /> replied to your post</p>;
      link = postLink;
       if (AppBskyFeedPost.isRecord(record)) {
        content = <PostPreview record={record} postUri={uri} />;
      }
      break;
      
    case 'mention':
        Icon = <AtSign className="w-6 h-6 text-primary" />;
        title = <p><AuthorLink /> mentioned you in a post</p>;
        link = postLink;
        if (AppBskyFeedPost.isRecord(record)) {
          content = <PostPreview record={record} postUri={uri} />;
        }
        break;

    case 'quote':
        Icon = <Quote className="w-6 h-6 text-primary" />;
        title = <p><AuthorLink /> quoted your post</p>;
        link = postLink;
        if (AppBskyFeedPost.isRecord(record)) {
          content = <PostPreview record={record} postUri={uri} />;
        }
        break;

    default:
      Icon = <FileText className="w-6 h-6 text-on-surface-variant" />;
      title = <p>New notification: {reason}</p>;
      link = '#';
  }
  
  const timeAgo = formatDistanceToNow(new Date(indexedAt), { addSuffix: true });

  return (
    <li className="py-2">
        <a href={link} className={`block p-4 rounded-xl transition-colors ${!isRead ? 'bg-primary/10' : 'bg-surface-2'} hover:bg-surface-3`}>
          <div className="flex gap-4">
            <div className="flex-shrink-0">{Icon}</div>
            <div className="flex-1">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                        <img src={author.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} alt={author.displayName} className="w-8 h-8 rounded-full bg-surface-3" loading="lazy" />
                        <div className="text-sm">{title}</div>
                    </div>
                    <span className="text-xs text-on-surface-variant flex-shrink-0 ml-2 pt-1">{timeAgo}</span>
                </div>
                {content && <div className="mt-1">{content}</div>}
            </div>
          </div>
        </a>
    </li>
  );
};

export default React.memo(NotificationItem);