
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { AtpProvider, useAtp } from './context/AtpContext';
import { UIProvider, useUI } from './context/UIContext';
import { HiddenPostsProvider } from './context/HiddenPostsContext';
import { ModerationProvider } from './context/ModerationContext';
import { Toaster, ToastProvider } from './components/ui/Toaster';
import Navbar from './components/layout/Navbar';
import BottomNavbar from './components/layout/BottomNavbar';
import Composer from './components/composer/Composer';
import LoginPrompt from './components/auth/LoginPrompt';
import { Loader2, Pencil } from 'lucide-react';
import { useHeadManager } from './hooks/useHeadManager';

// Lazy load screen components
const LoginScreen = lazy(() => import('./components/auth/LoginScreen'));
const HomeScreen = lazy(() => import('./components/home/HomeScreen'));
const ChannelsScreen = lazy(() => import('./components/channels/ChannelsScreen'));
const ProfileScreen = lazy(() => import('./components/profile/ProfileScreen'));
const PostScreen = lazy(() => import('./components/post/PostScreen'));
const SearchScreen = lazy(() => import('./components/search/SearchScreen'));
const NotificationsScreen = lazy(() => import('./components/notifications/NotificationsScreen'));
const FeedsScreen = lazy(() => import('./components/feeds/FeedsScreen'));
const FeedHeaderModal = lazy(() => import('./components/feeds/FeedHeaderModal'));
const FeedViewScreen = lazy(() => import('./components/feeds/FeedViewScreen'));
const SettingsScreen = lazy(() => import('./components/settings/SettingsScreen'));
const NotificationSettingsScreen = lazy(() => import('./components/settings/NotificationSettingsScreen'));
const LanguageSettingsScreen = lazy(() => import('./components/settings/LanguageSettingsScreen'));
const AccountSettingsScreen = lazy(() => import('./components/settings/AccountSettingsScreen'));
const ModerationSettingsScreen = lazy(() => import('./components/settings/ModerationSettingsScreen'));
const ModerationServiceScreen = lazy(() => import('./components/settings/ModerationServiceScreen'));
const MutedWordsScreen = lazy(() => import('./components/settings/MutedWordsScreen'));
const MoreScreen = lazy(() => import('./components/more/MoreScreen'));
const FollowsScreen = lazy(() => import('./components/profile/FollowsScreen'));
const EditProfileModal = lazy(() => import('./components/profile/EditProfileModal'));
const UpdateEmailModal = lazy(() => import('./components/settings/UpdateEmailModal'));
const UpdateHandleModal = lazy(() => import('./components/settings/UpdateHandleModal'));
const WatchScreen = lazy(() => import('./components/watch/WatchScreen'));
const MessagesScreen = lazy(() => import('./components/messages/MessagesScreen'));
const ConvoScreen = lazy(() => import('./components/messages/ConvoScreen'));
const MediaActionsModal = lazy(() => import('./components/shared/MediaActionsModal'));
const RepostModal = lazy(() => import('./components/shared/RepostModal'));


const App: React.FC = () => {
  return (
    <AtpProvider>
      <ModerationProvider>
        <UIProvider>
          <HiddenPostsProvider>
            <ToastProvider>
              <Main />
              <Toaster />
            </ToastProvider>
          </HiddenPostsProvider>
        </UIProvider>
      </ModerationProvider>
    </AtpProvider>
  );
};

const Main: React.FC = () => {
  const { session, isLoadingSession, chatSupported } = useAtp();
  const { 
    isLoginModalOpen, closeLoginModal, 
    isComposerOpen, openComposer, closeComposer, composerReplyTo, composerInitialText, 
    isCustomFeedHeaderVisible, 
    isFeedModalOpen, closeFeedModal,
    isEditProfileModalOpen, closeEditProfileModal,
    isUpdateEmailModalOpen, closeUpdateEmailModal,
    isUpdateHandleModalOpen, closeUpdateHandleModal,
    isMediaActionsModalOpen, closeMediaActionsModal, mediaActionsModalPost,
    isRepostModalOpen, closeRepostModal, repostModalPost
  } = useUI();
  const [route, setRoute] = useState(window.location.hash);
  const { i18n, t } = useTranslation();

  useHeadManager(); // Set default head tags

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeComposer();
        closeLoginModal();
        closeFeedModal();
        closeEditProfileModal();
        closeUpdateEmailModal();
        closeUpdateHandleModal();
        closeMediaActionsModal();
        closeRepostModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeComposer, closeLoginModal, closeFeedModal, closeEditProfileModal, closeUpdateEmailModal, closeUpdateHandleModal, closeMediaActionsModal, closeRepostModal]);

  if (isLoadingSession) {
    // Show a minimal loading state while session is being restored
    return <div className="min-h-screen bg-surface-1" />;
  }
  
  const isProfileScreen = route.startsWith('#/profile/');
  const isPostScreen = route.startsWith('#/post/');
  const isWatchScreen = route.startsWith('#/watch');
  const isConvoScreen = route.startsWith('#/messages/');
  const isSearchScreen = route.startsWith('#/search');
  const isNotificationsScreen = route.startsWith('#/notifications');
  const isMoreScreen = route.startsWith('#/more');
  const isSettingsScreen = route.startsWith('#/settings');
  const isFeedsScreen = route.startsWith('#/feeds');
  
  const isSectionView = isSearchScreen || isNotificationsScreen || isMoreScreen || isSettingsScreen || isFeedsScreen;
  const isBottomNavHidden = isPostScreen || isCustomFeedHeaderVisible || isWatchScreen || isConvoScreen || isProfileScreen;
  const isTopNavHidden = isBottomNavHidden || isSectionView;


  const renderContent = () => {
    const pathWithQuery = route.replace(/^#\//, '');
    const pathName = pathWithQuery.split('?')[0];
    const query = pathWithQuery.split('?')[1] || '';
    const parts = pathName.split('/');

    switch (parts[0]) {
      case 'profile':
        if (parts[2] === 'feed' && parts[3]) {
          const handle = parts[1];
          const rkey = parts[3];
          return <FeedViewScreen handle={handle} rkey={rkey} key={`${handle}-${rkey}`} />;
        }
        if (parts[2] === 'followers') {
            return <FollowsScreen actor={parts[1]} type="followers" key={`${parts[1]}-followers`} />;
        }
        if (parts[2] === 'following') {
            return <FollowsScreen actor={parts[1]} type="following" key={`${parts[1]}-following`} />;
        }
        return <ProfileScreen actor={parts[1]} key={parts[1]} />;
      case 'post':
        const did = parts[1];
        const rkey = parts[2];
        return <PostScreen did={did} rkey={rkey} key={`${did}-${rkey}`} />;
      case 'search':
        const params = new URLSearchParams(query);
        const q = params.get('q') || '';
        const filter = params.get('filter') || 'top';
        return <SearchScreen initialQuery={q} initialFilter={filter} key={`${q}-${filter}`} />;
      case 'notifications':
        if (!session) {
          window.location.hash = '#/';
          return null;
        }
        return <NotificationsScreen />;
      case 'channels':
        if (!session) {
          window.location.hash = '#/';
          return null;
        }
        return <ChannelsScreen />;
      case 'feeds':
        return <FeedsScreen />;
      case 'settings':
         if (!session) {
          window.location.hash = '#/';
          return null;
        }
        if (parts[1] === 'notifications') {
          return <NotificationSettingsScreen />;
        }
        if (parts[1] === 'language') {
            return <LanguageSettingsScreen />;
        }
        if (parts[1] === 'account') {
            return <AccountSettingsScreen />;
        }
        if (parts[1] === 'moderation') {
          return <ModerationSettingsScreen />;
        }
        if (parts[1] === 'mod-service' && parts[2]) {
            return <ModerationServiceScreen serviceDid={parts[2]} />;
        }
        if (parts[1] === 'muted-words') {
            return <MutedWordsScreen />;
        }
        return <SettingsScreen />;
      case 'more':
         if (!session) {
          window.location.hash = '#/';
          return null;
        }
        return <MoreScreen />;
      case 'watch':
        if (!session) {
          window.location.hash = '#/';
          return null;
        }
        return <WatchScreen />;
      case 'messages':
        if (!session) {
            window.location.hash = '#/';
            return null;
        }
        if (chatSupported === undefined) {
          return (
            <div className="w-full flex justify-center items-center pt-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          );
        }
        if (chatSupported === false) {
          return (
            <div className="text-center text-on-surface-variant p-8 bg-surface-2 rounded-xl">
              <h2 className="font-bold text-lg text-on-surface">{t('app.messagingNotSupported')}</h2>
              <p className="mt-1">{t('app.messagingNotSupportedDescription')}</p>
            </div>
          );
        }
        if (parts[1]) {
            return <ConvoScreen peerDid={parts[1]} key={parts[1]} />;
        }
        return <MessagesScreen />;
      case '':
      case 'home':
        return session ? <ChannelsScreen /> : <HomeScreen />;
      default:
        return session ? <ChannelsScreen /> : <HomeScreen />;
    }
  };
  
  const mainContainerClasses = `w-full flex justify-center md:pl-20`;

  const mainContentClasses = isWatchScreen || isConvoScreen || isProfileScreen
    ? 'w-full h-screen'
    : isPostScreen
      ? 'w-full max-w-3xl transition-all duration-300 pb-8'
      : `w-full max-w-3xl px-4 ${isBottomNavHidden ? 'pt-4' : isSectionView ? 'pt-4' : 'pt-20'} transition-all duration-300 ${session ? 'pb-24 md:pb-8' : 'pb-40 md:pb-8'}`;


  return (
    <div className="min-h-screen bg-surface-1 text-on-surface">
      <BottomNavbar isHidden={isBottomNavHidden} />
      {!isTopNavHidden && <Navbar />}
      <div className={mainContainerClasses}>
        <main className={mainContentClasses}>
          <Suspense fallback={
            <div className="w-full flex justify-center items-center pt-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }>
            {renderContent()}
          </Suspense>
        </main>
      </div>
      
      {!session && !isPostScreen && !isWatchScreen && <LoginPrompt />}

      {session && !isComposerOpen && (
        <button
          onClick={() => openComposer()}
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 bg-primary text-on-primary rounded-2xl w-14 h-14 flex items-center justify-center shadow-lg z-50 hover:bg-primary/90 transition-colors"
          aria-label={t('nav.compose')}
        >
          <Pencil size={24} />
        </button>
      )}

      {isComposerOpen && session && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center animate-fade-in"
          onClick={closeComposer}
        >
          <div 
            className="relative w-full h-full md:h-auto md:max-h-[85vh] md:max-w-2xl bg-surface-1 rounded-t-2xl md:rounded-2xl flex flex-col shadow-2xl animate-slide-in-from-bottom"
            onClick={e => e.stopPropagation()}
          >
             <Composer 
                onPostSuccess={closeComposer}
                onClose={closeComposer}
                replyTo={composerReplyTo}
                initialText={composerInitialText}
             />
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={closeLoginModal}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            <Suspense fallback={<div className="w-full max-w-md h-96 bg-surface-2 rounded-2xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <LoginScreen onSuccess={closeLoginModal} />
            </Suspense>
          </div>
        </div>
      )}
      
      {isFeedModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={closeFeedModal}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            <Suspense fallback={<div className="w-full max-w-md h-64 bg-surface-2 rounded-xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <FeedHeaderModal />
            </Suspense>
          </div>
        </div>
      )}

      {isEditProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={closeEditProfileModal}>
          <div className="relative w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <Suspense fallback={<div className="w-full max-w-xl h-[500px] bg-surface-2 rounded-xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <EditProfileModal
                onClose={closeEditProfileModal}
                onSuccess={() => {
                    closeEditProfileModal();
                    // Force a reload of the profile page if we are on it to see changes
                    if (window.location.hash === `#/profile/${session?.handle}` || window.location.hash === `#/profile/${session?.did}`) {
                        window.location.reload();
                    }
                }}
                />
            </Suspense>
          </div>
        </div>
      )}

      {isUpdateEmailModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={closeUpdateEmailModal}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            <Suspense fallback={<div className="w-full max-w-md h-64 bg-surface-2 rounded-xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <UpdateEmailModal
                  onClose={closeUpdateEmailModal}
                  onSuccess={() => {
                      closeUpdateEmailModal();
                      window.location.reload();
                  }}
                />
            </Suspense>
          </div>
        </div>
      )}

      {isUpdateHandleModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={closeUpdateHandleModal}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            <Suspense fallback={<div className="w-full max-w-md h-64 bg-surface-2 rounded-xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <UpdateHandleModal
                  onClose={closeUpdateHandleModal}
                  onSuccess={closeUpdateHandleModal}
                />
            </Suspense>
          </div>
        </div>
      )}

      {isMediaActionsModalOpen && mediaActionsModalPost && (
         <div 
          className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center animate-fade-in"
          onClick={closeMediaActionsModal}
        >
          <div 
            className="relative w-full max-w-lg bg-surface-2 rounded-t-2xl md:rounded-2xl shadow-2xl animate-slide-in-from-bottom"
            onClick={e => e.stopPropagation()}
          >
            <Suspense fallback={<div className="w-full h-96 bg-surface-2 rounded-t-2xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
              <MediaActionsModal
                post={mediaActionsModalPost}
                onClose={closeMediaActionsModal}
              />
            </Suspense>
          </div>
        </div>
      )}

      {isRepostModalOpen && repostModalPost && (
         <div 
          className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center animate-fade-in"
          onClick={closeRepostModal}
        >
          <div 
            className="relative w-full max-w-lg bg-surface-2 rounded-t-2xl md:rounded-2xl shadow-2xl animate-slide-in-from-bottom"
            onClick={e => e.stopPropagation()}
          >
            <Suspense fallback={<div className="w-full h-48 bg-surface-2 rounded-t-2xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
              <RepostModal
                post={repostModalPost}
                onClose={closeRepostModal}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
