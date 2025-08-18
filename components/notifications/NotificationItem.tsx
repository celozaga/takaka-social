
import React from 'react';
import { AppBskyNotificationListNotifications, AppBskyFeedPost, AtUri } from '@atproto/api';
import { Heart, Repeat, MessageCircle, UserPlus, FileText, AtSign, BadgeCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';

interface NotificationItemProps {
  notification: AppBskyNotificationListNotifications.Notification;
}

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
      if (AppBskyFeedPost.isRecord(record) && record.text) {
        content = <div className="text-sm text-on-surface-variant line-clamp-2 mt-1"><RichTextRenderer record={record as AppBskyFeedPost.Record} /></div>;
      }
      break;

    case 'repost':
      Icon = <Repeat className="w-6 h-6 text-primary" />;
      title = <p><AuthorLink /> reposted your post</p>;
      link = postLink;
      if (AppBskyFeedPost.isRecord(record) && record.text) {
        content = <div className="text-sm text-on-surface-variant line-clamp-2 mt-1"><RichTextRenderer record={record as AppBskyFeedPost.Record} /></div>;
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
      if (AppBskyFeedPost.isRecord(record) && record.text) {
        content = <div className="text-on-surface whitespace-pre-wrap mt-1"><RichTextRenderer record={record as AppBskyFeedPost.Record} /></div>;
      }
      break;
      
    case 'mention':
        Icon = <AtSign className="w-6 h-6 text-primary" />;
        title = <p><AuthorLink /> mentioned you in a post</p>;
        link = postLink;
        if (AppBskyFeedPost.isRecord(record) && record.text) {
          content = <div className="text-on-surface whitespace-pre-wrap mt-1"><RichTextRenderer record={record as AppBskyFeedPost.Record} /></div>;
        }
        break;

    default:
      Icon = <FileText className="w-6 h-6 text-on-surface-variant" />;
      title = <p>New notification: {reason}</p>;
      link = '#';
  }
  
  const timeAgo = formatDistanceToNow(new Date(indexedAt), { addSuffix: true });

  return (
    <li className="py-4">
        <a href={link} className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${!isRead ? 'bg-primary/10' : 'bg-surface-2'} hover:bg-surface-3`}>
            <div className="flex-shrink-0 mt-1">{Icon}</div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src={author.avatar} alt={author.displayName} className="w-8 h-8 rounded-full bg-surface-3" loading="lazy" />
                        <div className="text-sm">{title}</div>
                    </div>
                    <span className="text-xs text-on-surface-variant flex-shrink-0 ml-2">{timeAgo}</span>
                </div>
                {content && <div className="mt-2 text-sm">{content}</div>}
            </div>
        </a>
    </li>
  );
};

export default React.memo(NotificationItem);
