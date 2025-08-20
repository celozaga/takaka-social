import { Redirect } from 'expo-router';
import React from 'react';

export default function AppRoot() {
  // Redireciona da raiz para a tela inicial principal dentro do layout de abas.
  return <Redirect href="/home" />;
}
