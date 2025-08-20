import React from 'react';
import { AtpProvider } from '@/context/AtpContext';
import { UIProvider } from '@/context/UIContext';
import { HiddenPostsProvider } from '@/context/HiddenPostsContext';
import { ModerationProvider } from '@/context/ModerationContext';
import { ProfileCacheProvider } from '@/context/ProfileCacheContext';
import { Toaster, ToastProvider } from '@/components/ui/Toaster';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Import i18n configuration
import '@/lib/i18n';

export default function RootLayout() {
  return (
    <ToastProvider>
      <AtpProvider>
        <ModerationProvider>
          <UIProvider>
            <HiddenPostsProvider>
              <ProfileCacheProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
                <Toaster />
              </ProfileCacheProvider>
            </HiddenPostsProvider>
          </UIProvider>
        </ModerationProvider>
      </AtpProvider>
    </ToastProvider>
  );
}
