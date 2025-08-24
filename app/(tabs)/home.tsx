import React from 'react';
import { useTranslation } from 'react-i18next';
import { Head } from 'expo-router/head';
import HomeScreen from '@/components/home/HomeScreen';

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <>
      <Head>
        <title>{t('nav.home')}</title>
      </Head>
      <HomeScreen />
    </>
  );
}