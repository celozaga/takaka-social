
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
  const { isLoginModalOpen, closeLoginModal, isComposerOpen, closeComposer, composerReplyTo } = useUI();
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeComposer, closeLoginModal]);

  if (isLoadingSession) {
    // Show a minimal loading state while session is being restored
    return <div className="min-h-screen bg-surface-1" />;
  }
  
  const isPostScreen = route.startsWith('#/post/');

  const renderContent = () => {
    const parts = route.replace(/^#\//, '').split('/');
    
    switch (parts[0]) {
      case 'profile':
        return <ProfileScreen actor={parts[1]} key={parts[1]} />;
      case 'post':
        const did = parts[1];
        const rkey = parts[2];
        return <PostScreen did={did} rkey={rkey} key={`${did}-${rkey}`} />;
      case 'search':
        return <SearchScreen />;
      case 'notifications':
        if (!session) {
          window.location.hash = '#/';
          return null;
        }
        return <NotificationsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-1 text-on-surface">
      <BottomNavbar isHidden={isPostScreen} />
      <Navbar />
      <main className={`container mx-auto px-4 pt-20 transition-all duration-300 md:ml-20 md:max-w-4xl lg:max-w-5xl ${
        isPostScreen 
          ? 'pb-8' 
          : (session ? 'pb-24 md:pb-8' : 'pb-40 md:pb-8')
      }`}>
        {renderContent()}
      </main>
      
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
    </div>
  );
};

export default App;
