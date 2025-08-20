import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { ChatBskyConvoDefs, AppBskyActorDefs } from '@atproto/api';
import { Loader2 } from 'lucide-react';
import ConvoHeader from './ConvoHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import Head from '../shared/Head';

const ConvoScreen: React.FC<{ peerDid: string }> = ({ peerDid }) => {
  const { agent, session, chatSupported } = useAtp();
  const { t } = useTranslation();
  const { getProfile } = useProfileCache();
  const [messages, setMessages] = useState<(ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView)[]>([]);
  const [peer, setPeer] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const listEndRef = useRef<HTMLDivElement>(null);

  const fetchConvo = useCallback(async () => {
    if (chatSupported === false) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await agent.chat.bsky.convo.getMessages({ convoId: peerDid });
      const validMessages = data.messages.filter(
        (msg) =>
          ChatBskyConvoDefs.isMessageView(msg) || ChatBskyConvoDefs.isDeletedMessageView(msg)
      ) as (ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView)[];
      setMessages(validMessages.reverse()); // Reverse to show latest at the bottom
      setCursor(data.cursor);
      
      const profileRes = await getProfile(peerDid);
      setPeer(profileRes);
    } catch (err: any) {
      console.error('Failed to fetch conversation:', err);
      if (err.name !== 'XRPCNotSupported') {
        setError(err.message || t('messages.convoLoadingError'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [agent, peerDid, chatSupported, t, getProfile]);

  useEffect(() => {
    if (chatSupported === false) {
      return;
    }

    fetchConvo();
    agent.chat.bsky.convo.updateRead({ convoId: peerDid }).catch(err => {
      if (err.name !== 'XRPCNotSupported') console.error("Failed to mark convo as read", err);
    });

    const pollInterval = setInterval(async () => {
      try {
        const { data } = await agent.chat.bsky.convo.getMessages({ convoId: peerDid, limit: 50 });
        const newMessages = data.messages
          .filter(
            (msg) =>
              ChatBskyConvoDefs.isMessageView(msg) || ChatBskyConvoDefs.isDeletedMessageView(msg)
          )
          .reverse() as (ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView)[];
        
        setMessages(currentMessages => {
          const lastCurrentId = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1].id : null;
          const lastNewId = newMessages.length > 0 ? newMessages[newMessages.length - 1].id : null;

          if (lastNewId && lastNewId !== lastCurrentId) {
            agent.chat.bsky.convo.updateRead({ convoId: peerDid }).catch(err => {
              if (err.name !== 'XRPCNotSupported') console.error("Failed to mark convo as read on poll", err);
            });
            return newMessages;
          }
          return currentMessages;
        });
      } catch (err: any) {
        if (err.name === 'XRPCNotSupported') {
            clearInterval(pollInterval);
        } else {
            console.error("Polling for messages failed:", err);
        }
      }
    }, 5000);

    return () => {
        clearInterval(pollInterval);
    }
  }, [agent, peerDid, fetchConvo, chatSupported]);

  useEffect(() => {
    // Scroll to bottom on new message
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || chatSupported === false) return;
    try {
      // Optimistic update
      const optimisticMessage: ChatBskyConvoDefs.MessageView = {
        $type: 'chat.bsky.convo.defs#messageView',
        id: `temp-${Date.now()}`,
        rev: '',
        text: text,
        sentAt: new Date().toISOString(),
        sender: { did: session!.did },
      };
      setMessages(prev => [...prev, optimisticMessage]);

      const { data } = await agent.chat.bsky.convo.sendMessage({
        convoId: peerDid,
        message: { text },
      });
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? data : m));
    } catch (err) {
      console.error('Failed to send message:', err);
      // Revert optimistic update on failure
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    }
  };
  
  return (
    <>
      <Head><title>{peer ? t('messages.convoTitle', { peerName: peer.displayName || peer.handle }) : t('messages.title')}</title></Head>
      <div className="bg-surface-1 text-on-surface h-full flex flex-col">
        <ConvoHeader peer={peer} isLoading={isLoading} />
        <div className="flex-1 overflow-y-auto pt-20 pb-4 px-4 space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {error && <div className="text-center text-error p-4">{error}</div>}
          {!isLoading && messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={listEndRef} />
        </div>
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </>
  );
};

export default ConvoScreen;