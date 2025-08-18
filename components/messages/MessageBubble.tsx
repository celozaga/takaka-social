
import React from 'react';
import { AppBskyChatBskyConvoDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';

interface MessageBubbleProps {
  message: AppBskyChatBskyConvoDefs.MessageView;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { session } = useAtp();

  if (!AppBskyChatBskyConvoDefs.isMessageView(message)) {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-on-surface-variant bg-surface-2 px-2 py-1 rounded-full">
          Message deleted
        </p>
      </div>
    );
  }

  const isMe = message.sender.did === session?.did;
  const bubbleClasses = isMe
    ? 'bg-primary text-on-primary self-end'
    : 'bg-surface-3 text-on-surface self-start';
  const containerClasses = isMe ? 'justify-end' : 'justify-start';

  return (
    <div className={`flex ${containerClasses}`}>
      <div
        className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl whitespace-pre-wrap break-words ${bubbleClasses}`}
      >
        {message.text}
      </div>
    </div>
  );
};

export default MessageBubble;
