import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppBskyFeedDefs } from '@atproto/api';
import { useUI } from '@/context/UIContext';
import PostActions from './PostActions';
import { useTheme } from '@/components/shared/Theme';

interface PostPageWebActionBarProps {
  post: AppBskyFeedDefs.PostView;
}

const PostPageWebActionBar: React.FC<PostPageWebActionBarProps> = ({ post }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { openComposer } = useUI();
  
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => openComposer({ replyTo: { uri: post.uri, cid: post.cid } })}
        style={styles.replyButton}
      >
        <Text style={styles.replyButtonText}>Reply...</Text>
      </Pressable>
      <PostActions post={post} />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        paddingVertical: theme.spacing.m,
        marginVertical: theme.spacing.l,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.l,
    },
    replyButton: {
        flex: 1,
        backgroundColor: theme.colors.surfaceContainer,
        paddingHorizontal: theme.spacing.l,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.radius.full,
    },
    replyButtonText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
    },
});

export default PostPageWebActionBar;
