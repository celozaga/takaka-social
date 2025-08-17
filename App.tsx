
import React, { useState, useEffect } from 'react';
import { AtpProvider, useAtp } from './context/AtpContext';
import { UIProvider, useUI } from './context/UIContext';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import { Toaster, ToastProvider } from './components/ui/Toaster';
import ProfileScreen from './components/ProfileScreen';
import PostScreen from './components/PostScreen';
import SearchScreen from './components/SearchScreen';
import Navbar from './components/Navbar';
import BottomNavbar from './components/BottomNavbar';
import Composer from './components/Composer';
import NotificationsScreen from './components/NotificationsScreen';
import LoginPrompt from './components/LoginPrompt';
import FeedsScreen from './components/FeedsScreen';
import FeedHeaderModal from './components/FeedHeaderModal';
import FeedViewScreen from './components/FeedViewScreen';
import SettingsScreen from './components/SettingsScreen';
import NotificationSettingsScreen from './components/NotificationSettingsScreen';

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
  const { isLoginModalOpen, closeLoginModal, isComposerOpen, closeComposer, composerReplyTo, isCustomFeedHeaderVisible, isFeedModalOpen, closeFeedModal } = useUI();
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeComposer, closeLoginModal, closeFeedModal]);

  if (isLoadingSession) {
    // Show a minimal loading state while session is being restored
    return <div className="min-h-screen bg-surface-1" />;
  }
  
  const isPostScreen = route.startsWith('#/post/');
  const isNavbarHidden = isPostScreen || isCustomFeedHeaderVisible;

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
      default:
        return <HomeScreen />;
    }
  };
  
  const mainContentClasses = isPostScreen
    ? 'w-full max-w-3xl transition-all duration-300 pb-8'
    : `w-full max-w-3xl px-4 ${isNavbarHidden ? 'pt-4' : 'pt-20'} transition-all duration-300 ${session ? 'pb-24 md:pb-8' : 'pb-40 md:pb-8'}`;


  return (
    <div className="min-h-screen bg-surface-1 text-on-surface">
      <BottomNavbar isHidden={isPostScreen} />
      {!isNavbarHidden && <Navbar />}
      <div className="md:pl-20 w-full flex justify-center">
        <main className={mainContentClasses}>
          {renderContent()}
        </main>
      </div>
      
      {!session && !isPostScreen && <LoginPrompt />}

      {isComposerOpen && session && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-300">
          <div className="relative w-full max-w-xl">
             <Composer 
                onPostSuccess={closeComposer}
                onClose={closeComposer}
                replyTo={composerReplyTo}
             />
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-300" onClick={closeLoginModal}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            <LoginScreen onSuccess={closeLoginModal} />
          </div>
        </div>
      )}
      
      {isFeedModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-300" onClick={closeFeedModal}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            <FeedHeaderModal />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
