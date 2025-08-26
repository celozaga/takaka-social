import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { AppBskyFeedDefs } from '@atproto/api';
import { useAtp } from '@/context/AtpContext';

interface ReplyToProps {
  uri: string;
  cid: string;
}

interface ComposerOptions {
  replyTo?: ReplyToProps;
  initialText?: string;
}

interface RepliesModalData {
  post: AppBskyFeedDefs.PostView;
  thread: AppBskyFeedDefs.ThreadViewPost;
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
  isMediaActionsModalOpen: boolean;
  mediaActionsModalPost?: AppBskyFeedDefs.PostView;
  openMediaActionsModal: (post: AppBskyFeedDefs.PostView) => void;
  closeMediaActionsModal: () => void;
  isRepostModalOpen: boolean;
  repostModalPost?: AppBskyFeedDefs.PostView;
  openRepostModal: (post: AppBskyFeedDefs.PostView) => void;
  closeRepostModal: () => void;
  isRepliesModalOpen: boolean;
  repliesModalData?: RepliesModalData;
  openRepliesModal: (data: RepliesModalData) => void;
  closeRepliesModal: () => void;
  postForNav?: AppBskyFeedDefs.FeedViewPost;
  setPostForNav: (post?: AppBskyFeedDefs.FeedViewPost) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAtp();
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
  const [isMediaActionsModalOpen, setIsMediaActionsModalOpen] = useState(false);
  const [mediaActionsModalPost, setMediaActionsModalPost] = useState<AppBskyFeedDefs.PostView | undefined>(undefined);
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [repostModalPost, setRepostModalPost] = useState<AppBskyFeedDefs.PostView | undefined>(undefined);
  const [isRepliesModalOpen, setIsRepliesModalOpen] = useState(false);
  const [repliesModalData, setRepliesModalData] = useState<RepliesModalData | undefined>(undefined);
  const [postForNav, setPostForNav] = useState<AppBskyFeedDefs.FeedViewPost | undefined>(undefined);


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
  
  const openMediaActionsModal = useCallback((post: AppBskyFeedDefs.PostView) => {
    // Verificar se o usuário está autenticado antes de abrir o modal
    if (!session) {
      console.log('🔒 UIContext: Authentication required for media actions modal');
      openLoginModal();
      return;
    }
    setMediaActionsModalPost(post);
    setIsMediaActionsModalOpen(true);
  }, [session, openLoginModal]);
  
  const closeMediaActionsModal = useCallback(() => {
    setIsMediaActionsModalOpen(false);
    setTimeout(() => setMediaActionsModalPost(undefined), 300); // Delay clear for animation
  }, []);

  const openRepostModal = useCallback((post:AppBskyFeedDefs.PostView) => {
    // Verificar se o usuário está autenticado antes de abrir o modal
    if (!session) {
      console.log('🔒 UIContext: Authentication required for repost modal');
      openLoginModal();
      return;
    }
    setRepostModalPost(post);
    setIsRepostModalOpen(true);
  }, [session, openLoginModal]);

  const closeRepostModal = useCallback(() => {
    setIsRepostModalOpen(false);
    setTimeout(() => setRepostModalPost(undefined), 300);
  }, []);
  
  const openRepliesModal = useCallback((data: RepliesModalData) => {
    // Verificar se o usuário está autenticado antes de abrir o modal
    if (!session) {
      console.log('🔒 UIContext: Authentication required for replies modal');
      openLoginModal();
      return;
    }
    setRepliesModalData(data);
    setIsRepliesModalOpen(true);
  }, [session, openLoginModal]);

  const closeRepliesModal = useCallback(() => {
    setIsRepliesModalOpen(false);
    setTimeout(() => setRepliesModalData(undefined), 300); // Delay clear for animation
  }, []);

  return (
    <UIContext.Provider value={{ 
        isLoginModalOpen, openLoginModal, closeLoginModal, 
        isComposerOpen, openComposer, closeComposer, composerReplyTo, composerInitialText,
        isFeedModalOpen, feedModalUri, openFeedModal, closeFeedModal,
        isCustomFeedHeaderVisible, setCustomFeedHeaderVisible,
        isEditProfileModalOpen, openEditProfileModal, closeEditProfileModal,
        isUpdateEmailModalOpen, openUpdateEmailModal, closeUpdateEmailModal,
        isUpdateHandleModalOpen, openUpdateHandleModal, closeUpdateHandleModal,
        isMediaActionsModalOpen, mediaActionsModalPost, openMediaActionsModal, closeMediaActionsModal,
        isRepostModalOpen, repostModalPost, openRepostModal, closeRepostModal,
        isRepliesModalOpen, repliesModalData, openRepliesModal, closeRepliesModal,
        postForNav, setPostForNav,
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
