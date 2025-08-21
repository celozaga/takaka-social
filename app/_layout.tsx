import React, { Suspense, lazy } from 'react';
import { Stack, usePathname } from 'expo-router';
import { View, StyleSheet, Platform, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AtpProvider, useAtp } from '@/context/AtpContext';
import { UIProvider, useUI } from '@/context/UIContext';
import { HiddenPostsProvider } from '@/context/HiddenPostsContext';
import { ModerationProvider } from '@/context/ModerationContext';
import { ProfileCacheProvider } from '@/context/ProfileCacheContext';
import { Toaster, ToastProvider } from '@/components/ui/Toaster';
import { StatusBar } from 'expo-status-bar';
import BottomNavbar from '@/components/layout/BottomNavbar';
import LoginPrompt from '@/components/auth/LoginPrompt';
import theme from '@/lib/theme';

import '@/lib/i18n';

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
  <View style={styles.modalDialogShell}>
    <ActivityIndicator size="large" />
  </View>
);

function AppLayout() {
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
  } = useUI();
  
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const isFullScreenPage = ['/watch'].some(p => pathname.startsWith(p));
  const showNav = !isFullScreenPage;

  const mainContentStyle = [
    styles.mainContent,
    isFullScreenPage && styles.fullScreenContent,
    showNav && isDesktop && styles.mainContentDesktop,
    showNav && !isDesktop && styles.mainContentMobile
  ];

  return (
      <SafeAreaView style={styles.container}>
        {showNav && <BottomNavbar />}
        <View style={mainContentStyle}>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </View>
        {!session && showNav && <LoginPrompt />}

        {/* MODALS */}
        <Suspense fallback={null}>
          {isLoginModalOpen && (
            <Pressable style={styles.modalBackdrop} onPress={closeLoginModal}>
              <Pressable style={styles.modalDialogWrapper}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <LoginScreen onSuccess={closeLoginModal} />
                </Suspense>
              </Pressable>
            </Pressable>
          )}
          {isComposerOpen && (
            <View style={[styles.modalBackdrop, styles.composerBackdrop]}>
              <View style={styles.composerWrapper}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <Composer onClose={closeComposer} onPostSuccess={closeComposer} replyTo={composerReplyTo} initialText={composerInitialText} />
                </Suspense>
              </View>
            </View>
          )}
          {isFeedModalOpen && (
            <Pressable style={styles.modalBackdrop} onPress={closeFeedModal}>
              <Pressable style={styles.modalDialogWrapper}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <FeedHeaderModal />
                </Suspense>
              </Pressable>
            </Pressable>
          )}
          {isEditProfileModalOpen && (
             <Pressable style={styles.modalBackdrop} onPress={closeEditProfileModal}>
              <Pressable style={styles.modalDialogWrapper}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <EditProfileModal onClose={closeEditProfileModal} onSuccess={() => { closeEditProfileModal(); /* Could add a refetch here */ }} />
                </Suspense>
              </Pressable>
             </Pressable>
          )}
          {isUpdateEmailModalOpen && (
             <Pressable style={styles.modalBackdrop} onPress={closeUpdateEmailModal}>
              <Pressable style={styles.modalDialogWrapper}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <UpdateEmailModal onClose={closeUpdateEmailModal} onSuccess={closeUpdateEmailModal} />
                </Suspense>
              </Pressable>
             </Pressable>
          )}
           {isUpdateHandleModalOpen && (
             <Pressable style={styles.modalBackdrop} onPress={closeUpdateHandleModal}>
              <Pressable style={styles.modalDialogWrapper}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <UpdateHandleModal onClose={closeUpdateHandleModal} onSuccess={closeUpdateHandleModal} />
                </Suspense>
              </Pressable>
             </Pressable>
          )}
          {isMediaActionsModalOpen && mediaActionsModalPost && (
             <Pressable style={styles.modalBackdrop} onPress={closeMediaActionsModal}>
                <Pressable style={styles.bottomSheet}>
                    <Suspense fallback={<ModalSuspenseFallback />}>
                        <MediaActionsModal post={mediaActionsModalPost} onClose={closeMediaActionsModal} />
                    </Suspense>
                </Pressable>
             </Pressable>
          )}
          {isRepostModalOpen && repostModalPost && (
             <Pressable style={styles.modalBackdrop} onPress={closeRepostModal}>
                <Pressable style={styles.bottomSheet}>
                    <Suspense fallback={<ModalSuspenseFallback />}>
                        <RepostModal post={repostModalPost} onClose={closeRepostModal} />
                    </Suspense>
                </Pressable>
             </Pressable>
          )}
        </Suspense>
      </SafeAreaView>
  );
}


export default function RootLayout() {
  return (
    <ToastProvider>
      <AtpProvider>
        <ModerationProvider>
          <UIProvider>
            <HiddenPostsProvider>
              <ProfileCacheProvider>
                 <SafeAreaProvider>
                    <StatusBar style="light" />
                    <AppLayout />
                    <Toaster />
                 </SafeAreaProvider>
              </ProfileCacheProvider>
            </HiddenPostsProvider>
          </UIProvider>
        </ModerationProvider>
      </AtpProvider>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainContent: {
    flex: 1,
    marginHorizontal: 'auto',
    width: '100%',
    maxWidth: 640,
  },
  mainContentDesktop: {
    marginLeft: 80, // Width of Navigation Rail
  },
  mainContentMobile: {
    paddingBottom: 80, // Height of Navigation Bar
  },
  fullScreenContent: {
    paddingTop: 0,
    paddingLeft: 0,
    paddingBottom: 0,
    marginLeft: 0,
    maxWidth: '100%',
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
     paddingTop: Platform.select({ web: '5%' as any, default: 40 }),
  },
  composerWrapper: {
    width: '100%',
    maxWidth: 640,
    height: Platform.select({web: '90%' as any, default: '95%'}),
    maxHeight: 800,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.shape.large,
    overflow: 'hidden',
  },
  modalDialogWrapper: {
    width: '100%',
    maxWidth: 448,
    paddingHorizontal: theme.spacing.l,
  },
  modalDialogShell: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.shape.large,
    padding: theme.spacing.xl,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxWidth: 640,
    maxHeight: '90%',
    backgroundColor: theme.colors.surfaceContainer,
    borderTopLeftRadius: theme.shape.extraLarge,
    borderTopRightRadius: theme.shape.extraLarge,
    padding: theme.spacing.s,
    paddingBottom: theme.spacing.xl, // For home bar
  }
});