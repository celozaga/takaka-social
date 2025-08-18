
import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { AppBskyChatBskyConvoDefs } from '@atproto/api';
import { Loader2 } from 'lucide-react';
import MessagesHeader from './MessagesHeader';
import ConvoListItem from './ConvoListItem';

const MessagesScreen: React.FC = () => {
  const { agent } = useAtp();
  const { setCustomFeedHeaderVisible } = useUI();
  const [convos, setConvos] = useState<AppBskyChatBskyConvoDefs.ConvoView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCustomFeedHeaderVisible(true);
    return () => setCustomFeedHeaderVisible(false);
  }, [setCustomFeedHeaderVisible]);

  useEffect(() => {
    const fetchConvos = async () => {
      setIsLoading(true);
      try {
        const { data } = await agent.chat.bsky.convo.listConvos();
        setConvos(data.convos);
      } catch (err: any) {
        console.error('Failed to fetch conversations:', err);
        setError(err.message || "Could not load messages.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchConvos();
  }, [agent]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-14 h-14 rounded-full bg-surface-3"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-surface-3 rounded"></div>
                <div className="h-3 w-1/2 bg-surface-3 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-error p-8 bg-surface-2 rounded-xl">{error}</div>;
    }

    if (convos.length === 0) {
      return (
        <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">
          <h2 className="font-bold text-lg text-on-surface">No messages yet</h2>
          <p className="mt-1">Start a conversation from someone's profile.</p>
        </div>
      );
    }

    return (
      <ul>
        {convos.map((convo) => (
          <ConvoListItem key={convo.id} convo={convo} />
        ))}
      </ul>
    );
  };

  return (
    <div>
      <MessagesHeader />
      <div className="mt-4">{renderContent()}</div>
    </div>
  );
};

export default MessagesScreen;
