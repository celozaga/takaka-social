
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AtpProvider, useAtp } from './context/AtpContext';
import { UIProvider, useUI } from './context/UIContext';
import { Toaster, ToastProvider } from './components/ui/Toaster';
import Navbar from './components/layout/Navbar';
import BottomNavbar from './components/layout/BottomNavbar';
import Composer from './components/composer/Composer';
import LoginPrompt from './components/auth/LoginPrompt';
import { Loader2 } from 'lucide-react';

// Lazy load screen components
const LoginScreen = lazy(() => import('./components/auth/LoginScreen'));
const HomeScreen = lazy(() => import('./components/home/HomeScreen'));
const ProfileScreen = lazy(() => import('./components/profile/ProfileScreen'));
const PostScreen = lazy(() => import('./components/post/PostScreen'));
const SearchScreen = lazy(() => import('./components/search/SearchScreen'));
const NotificationsScreen = lazy(() => import('./components/notifications/NotificationsScreen'));
const FeedsScreen = lazy(() => import('./components/feeds/FeedsScreen'));
const FeedHeaderModal = lazy(() => import('./components/feeds/FeedHeaderModal'));
const FeedViewScreen = lazy(() => import('./components/feeds/FeedViewScreen'));
const SettingsScreen = lazy(() => import('./components/settings/SettingsScreen'));
const NotificationSettingsScreen = lazy(() => import('./components/settings/NotificationSettingsScreen'));
const MoreScreen = lazy(() => import('./components/more/MoreScreen'));
const FollowsScreen = lazy(() => import('./components/profile/FollowsScreen'));
const EditProfileModal = lazy(() => import('./components/profile/EditProfileModal'));
const WatchScreen = lazy(() => import('./components/watch/WatchScreen'));


const App: React.FC = () => {
  return (
    <AtpProvider>
      <UIProvider>
        <ToastProvider>
          <Main />
          <Toaster />
        </ToastProvider>
      </UIProvider>
    </AtpProvider>
  );
};

const Main: React.FC = () => {
  const { session, isLoadingSession } = useAtp();
  const { 
    isLoginModalOpen, closeLoginModal, 
    isComposerOpen, closeComposer, composerReplyTo, composerInitialText, 
    isCustomFeedHeaderVisible, 
    isFeedModalOpen, closeFeedModal,
    isEditProfileModalOpen, closeEditProfileModal
  } = useUI();
  const [route, setRoute] = useState(window.location.hash);

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeComposer, closeLoginModal, closeFeedModal, closeEditProfileModal]);

  if (isLoadingSession) {
    // Show a minimal loading state while session is being restored
    return <div className="min-h-screen bg-surface-1" />;
  }
  
  const isWatchScreen = route.startsWith('#/watch');
  const isPostScreen = route.startsWith('#/post/');
  const isNavbarHidden = isPostScreen || isCustomFeedHeaderVisible || isWatchScreen;

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
      default:
        return <HomeScreen />;
    }
  };
  
  const mainContainerClasses = `w-full flex justify-center md:pl-20`;

  const mainContentClasses = isWatchScreen
    ? 'w-full h-screen bg-black'
    : isPostScreen
      ? 'w-full max-w-3xl transition-all duration-300 pb-8'
      : `w-full max-w-3xl px-4 ${isNavbarHidden ? 'pt-4' : 'pt-20'} transition-all duration-300 ${session ? 'pb-24 md:pb-8' : 'pb-40 md:pb-8'}`;


  return (
    <div className="min-h-screen bg-surface-1 text-on-surface">
      <BottomNavbar isHidden={isNavbarHidden} />
      {!isNavbarHidden && <Navbar />}
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

      {isComposerOpen && session && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-300">
          <div className="relative w-full max-w-xl">
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
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-300" onClick={closeLoginModal}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            <Suspense fallback={<div className="w-full max-w-md h-96 bg-surface-2 rounded-2xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <LoginScreen onSuccess={closeLoginModal} />
            </Suspense>
          </div>
        </div>
      )}
      
      {isFeedModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-300" onClick={closeFeedModal}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            <Suspense fallback={<div className="w-full max-w-md h-64 bg-surface-2 rounded-xl flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <FeedHeaderModal />
            </Suspense>
          </div>
        </div>
      )}

      {isEditProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-300" onClick={closeEditProfileModal}>
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
    </div>
  );
};

export default App;
