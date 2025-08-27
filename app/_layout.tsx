// Polyfill for Intl.PluralRules to fix i18next compatibility
import 'intl-pluralrules';

import React, { Suspense, lazy } from 'react';
import { Stack, usePathname } from 'expo-router';
import { View, StyleSheet, Platform, ActivityIndicator, Pressable, useWindowDimensions, KeyboardAvoidingView, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AtpProvider, useAtp } from '@/context/AtpContext';
import { UIProvider, useUI } from '@/context/UIContext';
import { HiddenPostsProvider } from '@/context/HiddenPostsContext';
import { ModerationProvider } from '@/context/ModerationContext';
import { ProfileCacheProvider } from '@/context/ProfileCacheContext';
import { BookmarksProvider } from '@/context/BookmarksContext';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { Toaster, ToastProvider } from '@/components/shared';
import { StatusBar } from 'expo-status-bar';
import BottomNavbar from '@/components/layout/BottomNavbar';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { ThemeProvider, useTheme } from '@/components/shared';
import Head from 'expo-router/head';
import GlobalAuthGuard from '@/components/auth/GlobalAuthGuard';

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
const RepliesModal = lazy(() => import('@/components/replies/RepliesModal'));

const ModalSuspenseFallback = () => {
  return (
    <View style={{ 
      backgroundColor: '#1E1E1E',
      borderRadius: 12,
      padding: 32,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
    }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

// Internal component that uses theme
function ThemedAppLayout() {
  const { theme } = useTheme();
  const { session, isLoadingSession } = useAtp();
  
  // Create dynamic styles
  const createStyles = (theme: any) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    appContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    appContainerDesktop: {
      flexDirection: 'row',
      width: '100%',
      maxWidth: 720,
      marginHorizontal: 'auto',
    },
    mainContent: {
      flex: 1,
      width: '100%',
      maxWidth: 640,
    },
    mainContentMobile: {
      paddingBottom: 60, // Height of Navigation Bar
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
       paddingTop: Platform.select({ web: 40, default: 40 }),
       paddingBottom: Platform.select({ web: 10, default: 10 }),
    },
    composerWrapper: {
      width: '100%',
      maxWidth: 640,
      flex: 1,
      maxHeight: 800,
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.lg,
      overflow: 'hidden',
    },
    modalDialogWrapper: {
      width: '100%',
      maxWidth: 448,
      paddingHorizontal: theme.spacing.lg,
    },
    modalDialogShell: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.lg,
      padding: theme.spacing['2xl'],
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
      backgroundColor: theme.colors.surfaceContainer,
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      padding: theme.spacing.sm,
      paddingBottom: theme.spacing['2xl'], // For home bar
    },
    repliesSheet: {
        height: '85%',
        maxHeight: 800,
        padding: 0,
        paddingBottom: 0,
    },
    fullScreenLoader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
  });
  
  const styles = createStyles(theme);
  const {
    isLoginModalOpen, closeLoginModal,
    isComposerOpen, closeComposer, composerReplyTo, composerInitialText,
    isFeedModalOpen, closeFeedModal,
    isEditProfileModalOpen, closeEditProfileModal,
    isUpdateEmailModalOpen, closeUpdateEmailModal,
    isUpdateHandleModalOpen, closeUpdateHandleModal,
    isMediaActionsModalOpen, closeMediaActionsModal, mediaActionsModalPost,
    isRepostModalOpen, closeRepostModal, repostModalPost,
    isRepliesModalOpen, repliesModalData, closeRepliesModal,
  } = useUI();

  // Always call hooks at the top level before any returns
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  if (isLoadingSession) {
    return (
      <View style={styles.fullScreenLoader}>
        <ActivityIndicator size="large" color={theme.colors.onSurface} />
      </View>
    );
  }

  const isWatchPage = pathname.startsWith('/watch');
  const isPostPage = pathname.startsWith('/post');
  
  const isFullScreenPage = (isWatchPage || isPostPage) && !isDesktop;
  const showNav = !isFullScreenPage;

  const appContainerStyle: StyleProp<ViewStyle> = [
    styles.appContainer,
    isDesktop && showNav && styles.appContainerDesktop,
  ];

  const mainContentStyle: StyleProp<ViewStyle> = [
    styles.mainContent,
    isFullScreenPage && styles.fullScreenContent,
    showNav && !isDesktop && styles.mainContentMobile
  ];

  return (
      <SafeAreaView style={styles.container}>
        <View style={appContainerStyle}>
          {showNav && <BottomNavbar />}
          <View style={mainContentStyle}>
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: theme.colors.background } }} />
          </View>
        </View>
        
        {!session && showNav && <LoginPrompt />}

        {/* MODALS */}
        <Suspense fallback={null}>
          {isLoginModalOpen && (
            <Pressable style={styles.modalBackdrop as StyleProp<ViewStyle>} onPress={closeLoginModal}>
              <Pressable style={styles.modalDialogWrapper as StyleProp<ViewStyle>} onPress={(e) => e.stopPropagation()}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <LoginScreen onSuccess={closeLoginModal} />
                </Suspense>
              </Pressable>
            </Pressable>
          )}
          {isComposerOpen && (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={[styles.modalBackdrop, styles.composerBackdrop] as StyleProp<ViewStyle>}
            >
              <Pressable style={styles.composerWrapper as StyleProp<ViewStyle>} onPress={(e) => e.stopPropagation()}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <Composer onClose={closeComposer} onPostSuccess={closeComposer} replyTo={composerReplyTo} initialText={composerInitialText} />
                </Suspense>
              </Pressable>
            </KeyboardAvoidingView>
          )}
          {isFeedModalOpen && (
            <Pressable style={styles.modalBackdrop as StyleProp<ViewStyle>} onPress={closeFeedModal}>
              <Pressable style={styles.modalDialogWrapper as StyleProp<ViewStyle>} onPress={(e) => e.stopPropagation()}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <FeedHeaderModal />
                </Suspense>
              </Pressable>
            </Pressable>
          )}
          {isEditProfileModalOpen && (
             <Pressable style={styles.modalBackdrop as StyleProp<ViewStyle>} onPress={closeEditProfileModal}>
              <Pressable style={styles.modalDialogWrapper as StyleProp<ViewStyle>} onPress={(e) => e.stopPropagation()}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <EditProfileModal onClose={closeEditProfileModal} onSuccess={() => { closeEditProfileModal(); /* Could add a refetch here */ }} />
                </Suspense>
              </Pressable>
             </Pressable>
          )}
          {isUpdateEmailModalOpen && (
             <Pressable style={styles.modalBackdrop as StyleProp<ViewStyle>} onPress={closeUpdateEmailModal}>
              <Pressable style={styles.modalDialogWrapper as StyleProp<ViewStyle>} onPress={(e) => e.stopPropagation()}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <UpdateEmailModal onClose={closeUpdateEmailModal} onSuccess={closeUpdateEmailModal} />
                </Suspense>
              </Pressable>
             </Pressable>
          )}
           {isUpdateHandleModalOpen && (
             <Pressable style={styles.modalBackdrop as StyleProp<ViewStyle>} onPress={closeUpdateHandleModal}>
              <Pressable style={styles.modalDialogWrapper as StyleProp<ViewStyle>} onPress={(e) => e.stopPropagation()}>
                <Suspense fallback={<ModalSuspenseFallback />}>
                    <UpdateHandleModal onClose={closeUpdateHandleModal} onSuccess={closeUpdateHandleModal} />
                </Suspense>
              </Pressable>
             </Pressable>
          )}
          {isMediaActionsModalOpen && mediaActionsModalPost && (
             <Pressable style={styles.modalBackdrop as StyleProp<ViewStyle>} onPress={closeMediaActionsModal}>
                <Pressable style={styles.bottomSheet as StyleProp<ViewStyle>} onPress={(e) => e.stopPropagation()}>
                    <Suspense fallback={<ModalSuspenseFallback />}>
                        <MediaActionsModal post={mediaActionsModalPost} onClose={closeMediaActionsModal} />
                    </Suspense>
                </Pressable>
             </Pressable>
          )}
          {isRepostModalOpen && repostModalPost && (
             <Pressable style={styles.modalBackdrop as StyleProp<ViewStyle>} onPress={closeRepostModal}>
                <Pressable style={styles.bottomSheet as StyleProp<ViewStyle>} onPress={(e) => e.stopPropagation()}>
                    <Suspense fallback={<ModalSuspenseFallback />}>
                        <RepostModal post={repostModalPost} onClose={closeRepostModal} />
                    </Suspense>
                </Pressable>
             </Pressable>
          )}
          {isRepliesModalOpen && repliesModalData && (
             <Pressable style={styles.modalBackdrop as StyleProp<ViewStyle>} onPress={closeRepliesModal}>
                <Pressable style={[styles.bottomSheet, styles.repliesSheet] as StyleProp<ViewStyle>} onPress={(e) => e.stopPropagation()}>
                    <Suspense fallback={<ModalSuspenseFallback />}>
                        <RepliesModal data={repliesModalData} onClose={closeRepliesModal} />
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
    <AccessibilityProvider>
      <ThemeProvider defaultColorScheme="dark">
        <ToastProvider>
          <AtpProvider>
            <ModerationProvider>
              <UIProvider>
                <HiddenPostsProvider>
                  <BookmarksProvider>
                    <ProfileCacheProvider>
                      <SafeAreaProvider>
                        <GlobalAuthGuard>
                          <Head>
                            {/* Default meta tags */}
                            <meta property="og:site_name" content="Takaka" />
                            <meta property="og:type" content="website" />
                            <meta property="og:image" content="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
                          </Head>
                          <StatusBar style="light" />
                          <ThemedAppLayout />
                          <Toaster />
                        </GlobalAuthGuard>
                      </SafeAreaProvider>
                    </ProfileCacheProvider>
                  </BookmarksProvider>
                </HiddenPostsProvider>
              </UIProvider>
            </ModerationProvider>
          </AtpProvider>
        </ToastProvider>
      </ThemeProvider>
    </AccessibilityProvider>
  );
}


