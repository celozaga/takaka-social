
import React from 'react';
import { AppBskyChatBskyConvoDefs } from '@atproto/api';
import { formatDistanceToNow } from 'date-fns';

interface ConvoListItemProps {
  convo: AppBskyChatBskyConvoDefs.ConvoView;
}

const ConvoListItem: React.FC<ConvoListItemProps> = ({ convo }) => {
  const { peer, lastMessage, unreadCount } = convo;
  const lastMessageText = AppBskyChatBskyConvoDefs.isMessageView(lastMessage)
    ? lastMessage.text
    : 'Message deleted';
  const lastMessageDate = AppBskyChatBskyConvoDefs.isMessageView(lastMessage)
    ? new Date(lastMessage.sentAt)
    : null;

  const isUnread = unreadCount > 0;

  return (
    <li>
      <a
        href={`#/messages/${peer.did}`}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-3 transition-colors"
      >
        <div className="relative flex-shrink-0">
            <img
                src={peer.avatar}
                alt={peer.displayName}
                className="w-14 h-14 rounded-full bg-surface-3"
                loading="lazy"
            />
            {isUnread && (
                 <span className="absolute top-0 right-0 block h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-surface-2" />
            )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <p className={`font-semibold truncate ${isUnread ? 'text-on-surface' : 'text-on-surface-variant'}`}>
              {peer.displayName || `@${peer.handle}`}
            </p>
            {lastMessageDate && (
              <p className="text-xs text-on-surface-variant flex-shrink-0 ml-2">
                {formatDistanceToNow(lastMessageDate, { addSuffix: true })}
              </p>
            )}
          </div>
          <p className={`text-sm truncate mt-1 ${isUnread ? 'text-on-surface' : 'text-on-surface-variant'}`}>
            {lastMessageText}
          </p>
        </div>
      </a>
    </li>
  );
};

export default ConvoListItem;
