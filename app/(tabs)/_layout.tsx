import React, { Suspense, lazy } from 'react';
import { Slot, usePathname } from 'expo-router';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useUI } from '@/context/UIContext';
import Navbar from '@/components/layout/Navbar';
import BottomNavbar from '@/components/layout/BottomNavbar';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { useAtp } from '@/context/AtpContext';

// Lazy load modals for better initial performance
const LoginScreen = lazy(() => import('@/components/auth/LoginScreen'));
const Composer = lazy(() => import('@/components/composer/Composer'));
const FeedHeaderModal = lazy(() => import('@/components/feeds/FeedHeaderModal'));
const EditProfileModal = lazy(() => import('@/components/profile/EditProfileModal'));
const UpdateEmailModal = lazy(() => import('@/components/settings/UpdateEmailModal'));
const UpdateHandleModal = lazy(() => import('@/components/settings/UpdateHandleModal'));
const MediaActionsModal = lazy(() => import('@/components/shared/MediaActionsModal'));
const RepostModal = lazy(() => import('@/components/shared/RepostModal'));

const ModalSuspenseFallback = () => (
  <View style={styles.modalContentWrapper}>
    <ActivityIndicator size="large" />
  </View>
);

const MainLayout: React.FC = () => {
  const { session } = useAtp();
  const {
    isLoginModalOpen, closeLoginModal,
    isComposerOpen, closeComposer, composerReplyTo, composerInitialText,
    isFeedModalOpen, closeFeedModal,
    isEditProfileModalOpen, closeEditProfileModal,
    isUpdateEmailModalOpen, closeUpdateEmailModal,
    isUpdateHandleModalOpen, closeUpdateHandleModal,
    isMediaActionsModalOpen, closeMediaActionsModal, mediaActionsModalPost,
    isRepostModalOpen, closeRepostModal, repostModalPost,
    isCustomFeedHeaderVisible
  } = useUI();
  
  const pathname = usePathname();
  const isFullScreenPage = ['/watch', '/messages/'].some(p => pathname.startsWith(p));
  const showNav = !isFullScreenPage;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {showNav && <Navbar />}
        <View style={styles.mainContent}>
          <Slot />
        </View>
        {showNav && <BottomNavbar isHidden={isCustomFeedHeaderVisible} />}
        {!session && showNav && <LoginPrompt />}

        {/* MODALS */}
        <Suspense fallback={null}>
          {isLoginModalOpen && (
            <View style={styles.modalBackdrop}>
              <LoginScreen onSuccess={closeLoginModal} />
            </View>
          )}
          {isComposerOpen && (
            <View style={[styles.modalBackdrop, styles.composerBackdrop]}>
              <View style={styles.composerWrapper}>
                <Composer onClose={closeComposer} onPostSuccess={closeComposer} replyTo={composerReplyTo} initialText={composerInitialText} />
              </View>
            </View>
          )}
          {isFeedModalOpen && (
            <View style={styles.modalBackdrop}>
                <View style={styles.modalContentWrapper}>
                    <FeedHeaderModal />
                </View>
            </View>
          )}
          {isEditProfileModalOpen && (
             <View style={styles.modalBackdrop}>
                <EditProfileModal onClose={closeEditProfileModal} onSuccess={() => { closeEditProfileModal(); /* Could add a refetch here */ }} />
             </View>
          )}
          {isUpdateEmailModalOpen && (
             <View style={styles.modalBackdrop}>
                <UpdateEmailModal onClose={closeUpdateEmailModal} onSuccess={closeUpdateEmailModal} />
             </View>
          )}
           {isUpdateHandleModalOpen && (
             <View style={styles.modalBackdrop}>
                <UpdateHandleModal onClose={closeUpdateHandleModal} onSuccess={closeUpdateHandleModal} />
             </View>
          )}
          {isMediaActionsModalOpen && mediaActionsModalPost && (
             <View style={styles.modalBackdrop} onTouchEnd={closeMediaActionsModal}>
                <View style={styles.bottomSheet} onTouchEnd={(e) => e.stopPropagation()}>
                    <MediaActionsModal post={mediaActionsModalPost} onClose={closeMediaActionsModal} />
                </View>
             </View>
          )}
          {isRepostModalOpen && repostModalPost && (
             <View style={styles.modalBackdrop} onTouchEnd={closeRepostModal}>
                <View style={styles.bottomSheet} onTouchEnd={(e) => e.stopPropagation()}>
                    <RepostModal post={repostModalPost} onClose={closeRepostModal} />
                </View>
             </View>
          )}
        </Suspense>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111314', // surface-1
  },
  mainContent: {
    flex: 1,
    paddingTop: Platform.select({ web: 64, default: 0 }),
    paddingLeft: Platform.select({ web: 80, default: 0 }),
    paddingRight: Platform.select({ web: 0, default: 0 }),
    paddingBottom: Platform.select({ web: 0, default: 80 }),
    marginHorizontal: 'auto',
    width: '100%',
    maxWidth: 640,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  composerBackdrop: {
     justifyContent: 'flex-start',
     paddingTop: Platform.select({ web: '5vh', default: 40 }),
  },
  composerWrapper: {
    width: '100%',
    maxWidth: 640,
    height: Platform.select({web: '90vh', default: '95%'}),
    maxHeight: 800,
    backgroundColor: '#1E2021', // surface-2
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalContentWrapper: {
    width: '100%',
    maxWidth: 448,
    padding: 16
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#1E2021',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 8,
  }
});

export default MainLayout;
