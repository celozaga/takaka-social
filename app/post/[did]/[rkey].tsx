import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAtp } from '@/context/AtpContext';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs } from '@atproto/api';
import PostScreen from '@/components/post/PostScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '@/lib/theme';
import Head from '@/components/shared/Head';
import FullPostCardSkeleton from '@/components/post/FullPostCardSkeleton';
import ErrorState from '@/components/shared/ErrorState';
import { FileX2 } from 'lucide-react';

export default function PostPage() {
  const { did, rkey } = useLocalSearchParams<{ did: string; rkey: string }>();
  const { agent } = useAtp();
  const { t } = useTranslation();
  const [thread, setThread] = useState<AppBskyFeedDefs.ThreadViewPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!did || !rkey) {
      setError('Invalid post identifier.');
      setIsLoading(false);
      return;
    }

    const fetchPost = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;
        const { data } = await agent.app.bsky.feed.getPostThread({ uri: postUri, depth: 10 }); // Fetch a deep thread
        
        if (AppBskyFeedDefs.isThreadViewPost(data.thread)) {
          setThread(data.thread);
        } else {
          setError(t('post.notFound'));
        }
      } catch (e: any) {
        setError(e.message || t('post.loadingError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [did, rkey, agent, t]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* We can't render the real header since we don't have the post data yet, 
            so we show a generic one and the skeleton content */}
        <ScreenHeader title={t('common.post')} />
        <View style={styles.skeletonContainer}>
          <FullPostCardSkeleton />
        </View>
      </View>
    );
  }

  if (error) {
    const isNotFound = error.includes(t('post.notFound')) || error.includes('could not be found');
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader title={t('common.post')} />
        <View style={{ flex: 1 }}>
          <ErrorState
            icon={FileX2}
            title={isNotFound ? t('errors.postNotFound.title') : t('errors.genericError.title')}
            message={isNotFound ? t('errors.postNotFound.message') : t('errors.genericError.message')}
          />
        </View>
      </View>
    );
  }

  if (!thread) {
    return null;
  }
  
  const postText = (thread.post.record as any)?.text?.substring(0, 100);
  const postAuthor = thread.post.author.displayName || `@${thread.post.author.handle}`;

  return (
    <>
        <Head>
            <title>{`${t('common.post')} by ${postAuthor}`}</title>
            {postText && <meta name="description" content={postText} />}
        </Head>
        <PostScreen thread={thread} />
    </>
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    padding: theme.spacing.l,
    paddingTop: theme.spacing.l,
  },
});
