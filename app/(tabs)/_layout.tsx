import { Slot } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  // The main app layout (navbar, modals, etc.) is now handled by the root app/_layout.tsx.
  // This component now simply renders the matched child route within that persistent layout.
  return <Slot />;
}
