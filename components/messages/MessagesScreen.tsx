


import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { ChatBskyConvoDefs } from '@atproto/api';
import { Loader2 } from 'lucide-react';
import ScreenHeader from '../layout/ScreenHeader';
import ConvoListItem from './ConvoListItem';
import { useHeadManager } from '../../hooks/useHeadManager';

const MessagesScreen: React.FC = () => {
  const { agent, chatSupported } = useAtp();
  const { setCustomFeedHeaderVisible } = useUI();
  const { t } = useTranslation();
  const [convos, setConvos] = useState<ChatBskyConvoDefs.ConvoView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useHeadManager({ title: t('messages.title') });

  useEffect(() => {
    setCustomFeedHeaderVisible(true);
    return () => setCustomFeedHeaderVisible(false);
  }, [setCustomFeedHeaderVisible]);

  useEffect(() => {
    if (chatSupported === false) {
      setIsLoading(false);
      return;
    }
    
    if (chatSupported !== true) {
      return;
    }

    const fetchConvos = async () => {
      setIsLoading(true);
      try {
        const { data } = await agent.chat.bsky.convo.listConvos();
        setConvos(data.convos);
      } catch (err: any) {
        console.error('Failed to fetch conversations:', err);
        if (err.name !== 'XRPCNotSupported') {
          setError(err.message || t('messages.loadingError'));
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchConvos();
  }, [agent, chatSupported, t]);

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
          <h2 className="font-bold text-lg text-on-surface">{t('messages.emptyTitle')}</h2>
          <p className="mt-1">{t('messages.emptyDescription')}</p>
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
      <ScreenHeader title={t('messages.title')} />
      <div className="mt-4">{renderContent()}</div>
    </div>
  );
};

export default MessagesScreen;
