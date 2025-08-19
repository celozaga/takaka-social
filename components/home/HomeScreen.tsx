
import React from 'react';
import { useTranslation } from 'react-i18next';
import Timeline from '../shared/Timeline';
import { useHeadManager } from '../../hooks/useHeadManager';

const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  useHeadManager({ title: t('nav.home') });

  return (
    <div>
      <Timeline key="discover-timeline" feedUri={DISCOVER_FEED_URI} />
    </div>
  );
};

export default HomeScreen;
