import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAtp } from '@/context/AtpContext';
import { useTranslation } from 'react-i18next';
import { AppBskyFeedDefs, AppBskyEmbedImages, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import PostScreen from '@/components/post/PostScreen';
import ScreenHeader from '@/components/layout/ScreenHeader';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/components/shared/Theme/ThemeProvider';
import Head from 'expo-router/head';
import FullPostCardSkeleton from '@/components/post/FullPostCardSkeleton';
import ErrorState from '@/components/shared/ErrorState';
import { FileX2 } from 'lucide-react';

/**
 * Public Post Page - Accessible without authentication
 * Route: /posts/[did]/[rkey]
 * 
 * This page provides public access to individual posts using the Bluesky public API.
 * It prioritizes public API access to ensure non-authenticated users can view content.
 */
export default function PublicPostPage() {
  const { did, rkey } = useLocalSearchParams<{ did: string; rkey: string }>();
  const { theme } = useTheme();
  const { agent, publicApiAgent, session } = useAtp();
  const { t } = useTranslation();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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
      
      const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;
      console.log('🔍 DEBUG: Fetching post thread for public access:', postUri);
      
      // Strategy 1: Always try public API agent first for maximum accessibility
      try {
        console.log('🔍 DEBUG: Using public API agent for post thread (public route)');
        const { data } = await publicApiAgent.app.bsky.feed.getPostThread({ 
          uri: postUri, 
          depth: 10 
        });
        
        if (AppBskyFeedDefs.isThreadViewPost(data.thread)) {
          console.log('✅ SUCCESS: Post thread fetched via public API (public route)');
          setThread(data.thread);
          return;
        } else {
          console.log('⚠️ WARNING: Post thread not found via public API (public route)');
          setError(t('post.notFound'));
          return;
        }
      } catch (publicError: any) {
        console.log('⚠️ WARNING: Public API post fetch failed (public route):', publicError.message);
        
        // Strategy 2: Fallback to authenticated agent only if available and public API fails
        if (session && agent) {
          try {
            console.log('🔍 DEBUG: Falling back to authenticated agent (public route)');
            const { data } = await agent.app.bsky.feed.getPostThread({ 
              uri: postUri, 
              depth: 10 
            });
            
            if (AppBskyFeedDefs.isThreadViewPost(data.thread)) {
              console.log('✅ SUCCESS: Post thread fetched via authenticated agent (public route)');
              setThread(data.thread);
              return;
            } else {
              console.log('⚠️ WARNING: Post thread not found via authenticated agent (public route)');
              setError(t('post.notFound'));
              return;
            }
          } catch (authError: any) {
            console.error('❌ ERROR: Both public and authenticated post fetch failed (public route):', authError.message);
            setError(authError.message || t('post.loadingError'));
          }
        } else {
          console.error('❌ ERROR: Public post fetch failed and no session available (public route):', publicError.message);
          setError(publicError.message || t('post.loadingError'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [did, rkey, agent, publicApiAgent, session, t]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
  
  const postRecord = (thread.post.record as any);
  const postText = postRecord?.text || '';
  const truncatedText = postText.length > 155 ? postText.substring(0, 155) + '...' : postText;
  const postAuthor = thread.post.author.displayName || `@${thread.post.author.handle}`;
  const postUrl = `https://bsky.app/profile/${thread.post.author.did}/post/${rkey}`;

  let ogImage = thread.post.author.avatar; // Default to author avatar
  const embed = thread.post.embed;
  if (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) {
    ogImage = embed.images[0].fullsize;
  } else if (AppBskyEmbedVideo.isView(embed)) {
    ogImage = embed.thumbnail;
  } else if (AppBskyEmbedRecordWithMedia.isView(embed)) {
      if (AppBskyEmbedImages.isView(embed.media) && embed.media.images.length > 0) {
          ogImage = embed.media.images[0].fullsize;
      } else if (AppBskyEmbedVideo.isView(embed.media)) {
          ogImage = embed.media.thumbnail;
      }
  }

  return (
    <>
        <Head>
            <title>{`${postAuthor}: "${postText.substring(0, 50)}..." | Takaka`}</title>
            <meta name="description" content={truncatedText} />
            {/* Open Graph Tags */}
            <meta property="og:title" content={`${postAuthor} on Takaka`} />
            <meta property="og:description" content={truncatedText} />
            <meta property="og:url" content={postUrl} />
            <meta property="og:type" content="article" />
            <meta property="article:author" content={postAuthor} />
            {ogImage && <meta property="og:image" content={ogImage} />}
        </Head>
        <PostScreen thread={thread} />
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  skeletonContainer: {
    padding: theme.spacing.l,
    paddingTop: theme.spacing.l,
  },
});