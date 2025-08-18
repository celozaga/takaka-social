
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyChatBskyConvoDefs, AppBskyActorDefs } from '@atproto/api';
import { Loader2 } from 'lucide-react';
import ConvoHeader from './ConvoHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

const ConvoScreen: React.FC<{ peerDid: string }> = ({ peerDid }) => {
  const { agent, session } = useAtp();
  const [messages, setMessages] = useState<AppBskyChatBskyConvoDefs.MessageView[]>([]);
  const [peer, setPeer] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const listEndRef = useRef<HTMLDivElement>(null);

  const fetchConvo = useCallback(async () => {
    try {
      const { data } = await agent.chat.bsky.convo.getConvo({ convoId: peerDid });
      setMessages(data.messages.reverse()); // Reverse to show latest at the bottom
      setCursor(data.cursor);
      // Fetch profile info for the header
      const profileRes = await agent.getProfile({ actor: peerDid });
      setPeer(profileRes.data);
    } catch (err: any) {
      console.error('Failed to fetch conversation:', err);
      setError(err.message || "Could not load conversation.");
    } finally {
      setIsLoading(false);
    }
  }, [agent, peerDid]);

  useEffect(() => {
    fetchConvo();
    agent.chat.bsky.convo.updateRead({ convoId: peerDid });

    const pollInterval = setInterval(async () => {
      try {
        const { data } = await agent.chat.bsky.convo.getConvo({ convoId: peerDid, limit: 50 });
        const newMessages = data.messages.reverse();
        // A simple check to see if new messages have arrived
        if (newMessages.length > 0 && (messages.length === 0 || newMessages[newMessages.length - 1].id !== messages[messages.length - 1].id)) {
            setMessages(newMessages);
            agent.chat.bsky.convo.updateRead({ convoId: peerDid });
        }
      } catch (err) {
        console.error("Polling for messages failed:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
        clearInterval(pollInterval);
    }
  }, [agent, peerDid]);

  useEffect(() => {
    // Scroll to bottom on new message
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    try {
      // Optimistic update
      const optimisticMessage: AppBskyChatBskyConvoDefs.MessageView = {
        $type: 'app.bsky.chat.convo.defs#messageView',
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
      setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? data.message : m));
    } catch (err) {
      console.error('Failed to send message:', err);
      // Revert optimistic update on failure
      setMessages(prev => prev.filter(m => m.id !== `temp-${Date.now()}`));
    }
  };
  
  return (
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
  );
};

export default ConvoScreen;
