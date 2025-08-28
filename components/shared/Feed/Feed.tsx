/**
 * Feed Component - Universal Feed with Public Access Support
 * 
 * This component provides seamless public access for non-authenticated users
 * while maintaining full functionality for authenticated users.
 */

import React from 'react';
import FeedContainer, { FeedContainerProps } from './FeedContainer';
import PublicFeedWrapper from './PublicFeedWrapper';
import { useAtp } from '../../../context/AtpContext';

interface FeedProps extends FeedContainerProps {
  // Additional props specific to the universal Feed component
  fallbackMessage?: string;
  requiresAuth?: boolean;
  onAuthRequired?: () => void;
}

const Feed: React.FC<FeedProps> = ({
  feedUri,
  authorFeedFilter,
  searchQuery,
  searchSort = 'top',
  mediaFilter = 'all',
  // layout = 'grid',
  // ListHeaderComponent,
  // postFilter,
  fallbackMessage,
  requiresAuth = false,
  onAuthRequired,
  ...props
}) => {
  const { session } = useAtp();
  
  console.log('🔄 DEBUG Feed Component:', {
    feedUri,
    searchQuery,
    authorFeedFilter,
    // postFilter,
    hasSession: !!session,
    requiresAuth
  });

  // Determine feed type based on props
  const getFeedType = (): 'profile' | 'author' | 'list' | 'search' | 'timeline' => {
    if (searchQuery) return 'search';
    if (feedUri && feedUri.includes('app.bsky.feed.generator')) return 'timeline';
    if (feedUri && feedUri.includes('app.bsky.graph.list')) return 'list';
    if (feedUri && authorFeedFilter) return 'author';
    if (feedUri) return 'profile';
    return 'timeline';
  };

  const feedType = getFeedType();
  
  // Extract actor/list/query from feedUri and props
  const getActor = () => {
    if (feedType === 'profile' || feedType === 'author') {
      return feedUri;
    }
    return undefined;
  };
  
  const getList = () => {
    if (feedType === 'list' && feedUri?.includes('app.bsky.graph.list')) {
      return feedUri;
    }
    return undefined;
  };

  const feedContent = (
    <FeedContainer
      feedUri={feedUri}
      authorFeedFilter={authorFeedFilter}
      searchQuery={searchQuery}
      searchSort={searchSort}
      mediaFilter={mediaFilter}
      // layout={layout}
      // ListHeaderComponent={ListHeaderComponent}
      // postFilter={postFilter}
      {...props}
    />
  );

  // Special handling for discovery feed - always allow public access
  const isDiscoveryFeed = feedUri?.includes('whats-hot') || feedUri?.includes('discovery');
  
  // If user is authenticated or it's a timeline/discovery feed, render directly
  if (session || feedType === 'timeline' || isDiscoveryFeed) {
    return feedContent;
  }

  // Wrap with PublicFeedWrapper for non-authenticated users accessing other content
  return (
    <PublicFeedWrapper
      feedType={feedType}
      actor={getActor()}
      list={getList()}
      query={searchQuery}
      requiresAuth={requiresAuth}
      onAuthRequired={onAuthRequired}
      fallbackMessage={fallbackMessage}
    >
      {feedContent}
    </PublicFeedWrapper>
  );
};

export default Feed;