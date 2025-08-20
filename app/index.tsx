import { Redirect } from 'expo-router';
import React from 'react';

export default function AppRoot() {
  return <Redirect href="/(tabs)/" />;
}
