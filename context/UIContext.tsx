
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

interface ReplyToProps {
  uri: string;
  cid: string;
}

interface ComposerOptions {
  replyTo?: ReplyToProps;
  initialText?: string;
}

interface UIContextType {
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isComposerOpen: boolean;
  composerReplyTo?: ReplyToProps;
  composerInitialText?: string;
  openComposer: (options?: ComposerOptions) => void;
  closeComposer: () => void;
  isFeedModalOpen: boolean;
  feedModalUri?: string;
  openFeedModal: (uri: string) => void;
  closeFeedModal: () => void;
  isCustomFeedHeaderVisible: boolean;
  setCustomFeedHeaderVisible: (visible: boolean) => void;
  isEditProfileModalOpen: boolean;
  openEditProfileModal: () => void;
  closeEditProfileModal: () => void;
  isUpdateEmailModalOpen: boolean;
  openUpdateEmailModal: () => void;
  closeUpdateEmailModal: () => void;
  isUpdateHandleModalOpen: boolean;
  openUpdateHandleModal: () => void;
  closeUpdateHandleModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerReplyTo, setComposerReplyTo] = useState<ReplyToProps | undefined>(undefined);
  const [composerInitialText, setComposerInitialText] = useState<string | undefined>(undefined);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [feedModalUri, setFeedModalUri] = useState<string | undefined>(undefined);
  const [isCustomFeedHeaderVisible, setCustomFeedHeaderVisible] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isUpdateEmailModalOpen, setIsUpdateEmailModalOpen] = useState(false);
  const [isUpdateHandleModalOpen, setIsUpdateHandleModalOpen] = useState(false);

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  const openComposer = useCallback((options?: ComposerOptions) => {
    setComposerReplyTo(options?.replyTo);
    setComposerInitialText(options?.initialText);
    setIsComposerOpen(true);
  }, []);

  const closeComposer = useCallback(() => {
    setIsComposerOpen(false);
    setComposerReplyTo(undefined);
    setComposerInitialText(undefined);
  }, []);

  const openFeedModal = useCallback((uri: string) => {
    setFeedModalUri(uri);
    setIsFeedModalOpen(true);
  }, []);

  const closeFeedModal = useCallback(() => {
    setIsFeedModalOpen(false);
    setFeedModalUri(undefined);
  }, []);
  
  const openEditProfileModal = useCallback(() => setIsEditProfileModalOpen(true), []);
  const closeEditProfileModal = useCallback(() => setIsEditProfileModalOpen(false), []);

  const openUpdateEmailModal = useCallback(() => setIsUpdateEmailModalOpen(true), []);
  const closeUpdateEmailModal = useCallback(() => setIsUpdateEmailModalOpen(false), []);

  const openUpdateHandleModal = useCallback(() => setIsUpdateHandleModalOpen(true), []);
  const closeUpdateHandleModal = useCallback(() => setIsUpdateHandleModalOpen(false), []);

  return (
    <UIContext.Provider value={{ 
        isLoginModalOpen, openLoginModal, closeLoginModal, 
        isComposerOpen, openComposer, closeComposer, composerReplyTo, composerInitialText,
        isFeedModalOpen, feedModalUri, openFeedModal, closeFeedModal,
        isCustomFeedHeaderVisible, setCustomFeedHeaderVisible,
        isEditProfileModalOpen, openEditProfileModal, closeEditProfileModal,
        isUpdateEmailModalOpen, openUpdateEmailModal, closeUpdateEmailModal,
        isUpdateHandleModalOpen, openUpdateHandleModal, closeUpdateHandleModal,
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
