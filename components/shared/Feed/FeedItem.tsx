import React from 'react';
import { View } from 'react-native';
import { AppBskyFeedDefs } from '@atproto/api';
import { useTheme } from '@/components/shared';
import PostCard from '../../post/PostCard';
import FullPostCard from '../../post/FullPostCard';

interface FeedItemProps {
  item: AppBskyFeedDefs.FeedViewPost;
  layout: 'grid' | 'list';
}

const FeedItem: React.FC<FeedItemProps> = ({ item, layout }) => {
  const { theme } = useTheme();

  if (layout === 'grid') {
    return (
      <View style={{ 
        // Ensure proper grid layout
        flex: 1, // Take available space in the column
      }}>
        <PostCard feedViewPost={item} />
      </View>
    );
  } else {
    return (
      <View style={{ paddingHorizontal: theme.spacing.sm }}>
        <FullPostCard feedViewPost={item} />
      </View>
    );
  }
};

export default FeedItem;
