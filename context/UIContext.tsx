
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface ReplyToProps {
  uri: string;
  cid: string;
}

interface UIContextType {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isComposerOpen: boolean;
  composerReplyTo?: ReplyToProps;
  openComposer: (replyTo?: ReplyToProps) => void;
  closeComposer: () => void;
  isFeedModalOpen: boolean;
  feedModalUri?: string;
  openFeedModal: (uri: string) => void;
  closeFeedModal: () => void;
  isCustomFeedHeaderVisible: boolean;
  setCustomFeedHeaderVisible: (visible: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerReplyTo, setComposerReplyTo] = useState<ReplyToProps | undefined>(undefined);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [feedModalUri, setFeedModalUri] = useState<string | undefined>(undefined);
  const [isCustomFeedHeaderVisible, setCustomFeedHeaderVisible] = useState(false);

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);
  
  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const openComposer = useCallback((replyTo?: ReplyToProps) => {
    setComposerReplyTo(replyTo);
    setIsComposerOpen(true);
  }, []);

  const closeComposer = useCallback(() => {
    setIsComposerOpen(false);
    setComposerReplyTo(undefined);
  }, []);

  const openFeedModal = useCallback((uri: string) => {
    setFeedModalUri(uri);
    setIsFeedModalOpen(true);
  }, []);

  const closeFeedModal = useCallback(() => {
    setIsFeedModalOpen(false);
    setFeedModalUri(undefined);
  }, []);

  return (
    <UIContext.Provider value={{ 
        isLoginModalOpen, openLoginModal, closeLoginModal, 
        isComposerOpen, openComposer, closeComposer, composerReplyTo,
        isFeedModalOpen, feedModalUri, openFeedModal, closeFeedModal,
        isCustomFeedHeaderVisible, setCustomFeedHeaderVisible
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
