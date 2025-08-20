import React from 'react';
import { AtpProvider } from '@/context/AtpContext';
import { UIProvider } from '@/context/UIContext';
import { HiddenPostsProvider } from '@/context/HiddenPostsContext';
import { ModerationProvider } from '@/context/ModerationContext';
import { Toaster, ToastProvider } from '@/components/ui/Toaster';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Import i18n configuration
import '@/lib/i18n';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AtpProvider>
          <ModerationProvider>
            <UIProvider>
              <HiddenPostsProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
                <Toaster />
              </HiddenPostsProvider>
            </UIProvider>
          </ModerationProvider>
        </AtpProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
