import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHeadManager } from '../../hooks/useHeadManager';
import TrendingTopics from '../search/TrendingTopics';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  useHeadManager({ title: t('nav.home') });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome to Takaka</h1>
        <p className="text-on-surface-variant">A clean, channel-focused client for Bluesky.</p>
      </div>
      <TrendingTopics />
    </div>
  );
};

export default HomeScreen;
