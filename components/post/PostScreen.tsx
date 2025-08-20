
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { Link, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, ScrollView, FlatList, useWindowDimensions, Linking, Platform } from 'react-native';
import { AppBskyFeedDefs, AppBskyActorDefs, RichText, AppBskyEmbedImages, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import Reply from './Reply';
import PostScreenActionBar from './PostScreenActionBar';
import { ArrowLeft, ExternalLink, BadgeCheck, ChevronLeft, ChevronRight, MessageSquareDashed, MoreHorizontal, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import RichTextRenderer from '../shared/RichTextRenderer';
import Head from '../shared/Head';
import { useModeration } from '../../context/ModerationContext';
import ContentWarning from '../shared/ContentWarning';
import SharedVideoPlayer from '../shared/VideoPlayer';
import { moderatePost } from '../../lib/moderation';

const getImageUrlFromPost = (post: AppBskyFeedDefs.PostView): string | undefined => {
    if (!post.embed) return undefined;
    
    let embed = post.embed;
    if (AppBskyEmbedRecordWithMedia.isView(embed)) {
        embed = embed.media;
    }

    if (AppBskyEmbedImages.isView(embed) && embed.images[0]) {
        return embed.images[0].thumb;
    }
    if (AppBskyEmbedVideo.isView(embed)) {
        return embed.thumbnail;
    }
    return undefined;
};

interface PostScreenProps {
  did: string;
  rkey: string;
}

const PostScreen: React.FC<PostScreenProps> = ({ did, rkey }) => {
  const { agent } = useAtp();
  const router = useRouter();
  const { openMediaActionsModal } = useUI();
  const { t } = useTranslation();
  const moderation = useModeration();
  const { getProfile } = useProfileCache();
  const { width } = useWindowDimensions();
  
  const [thread, setThread] = useState<AppBskyFeedDefs.ThreadViewPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postAuthor, setPostAuthor] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
 
  const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;

  const record = thread?.post.record as { text: string, facets?: RichText['facets'], createdAt: string };
  const postExcerpt = record?.text ? (record.text.length > 100 ? record.text.substring(0, 100) + '…' : record.text) : '';
  const title = postAuthor ? `${t('post.byline', { user: `@${postAuthor.handle}`})}${postExcerpt ? `: "${postExcerpt}"` : ''}` : t('common.post');
  const description = record?.text;
  const imageUrl = thread?.post ? getImageUrlFromPost(thread.post) : undefined;

  useEffect(() => {
    setCurrentImageIndex(0); // Reset for new posts
    const fetchThread = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await agent.getPostThread({ uri: postUri, depth: 100, parentHeight: 5 });
        if (AppBskyFeedDefs.isThreadViewPost(data.thread)) {
          setThread(data.thread);
          const profileRes = await getProfile(data.thread.post.author.did);
          setPostAuthor(profileRes);
        } else {
          throw new Error(t('post.notFound'));
        }
      } catch (err: any) {
        console.error("Failed to fetch post thread:", err);
        setError(err.message || t('post.loadingError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchThread();
  }, [agent, postUri, t, getProfile]);

  useEffect(() => {
    if (!thread?.post) return;

    const embed = thread.post.embed;
    let videoEmbed: AppBskyEmbedVideo.View | undefined;

    if (AppBskyEmbedVideo.isView(embed)) {
        videoEmbed = embed;
    } else if (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media)) {
        videoEmbed = embed.media as AppBskyEmbedVideo.View;
    }

    if (videoEmbed) {
        const fetchUrl = async () => {
            try {
                const result = await (agent.api.app.bsky.video as any).getPlaybackUrl({
                    did: thread.post.author.did,
                    cid: videoEmbed!.cid,
                });
                setHlsUrl(result.data.url);
            } catch (error) {
                console.warn(`Could not get HLS playback URL for ${thread.post.uri}, falling back to blob.`, error);
                setHlsUrl(null);
            }
        };
        fetchUrl();
    }
  }, [thread, agent]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }).current;

  const renderMedia = (post:AppBskyFeedDefs.PostView) => {
    if (!post.embed) return null;
    let embed = post.embed;
    if(AppBskyEmbedRecordWithMedia.isView(post.embed)) {
        embed = post.embed.media;
    }

    if (AppBskyEmbedImages.isView(embed)) {
        const images = embed.images;
        if(images.length === 0) return null;

        return (
            <View>
                <FlatList
                    ref={flatListRef}
                    data={images}
                    renderItem={({ item }) => (
                        <Pressable onPress={() => Linking.openURL(item.fullsize)} style={{ width: width - 32 }}>
                           <Image source={{ uri: item.thumb }} style={styles.carouselImage} resizeMode="contain" />
                        </Pressable>
                    )}
                    keyExtractor={(item) => item.fullsize}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                />
                {images.length > 1 && (
                    <View style={styles.carouselCounter}>
                        <Text style={styles.carouselCounterText}>{currentImageIndex + 1} / {images.length}</Text>
                    </View>
                )}
            </View>
        );
    }

    if (AppBskyEmbedVideo.isView(embed)) {
      const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
      const videoCid = embed.cid;
      if (!authorDid || !videoCid || !agent.service) return null;
      const serviceUrl = agent.service.toString();
      const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
      const blobVideoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
      const playerOptions = { autoplay: true, controls: true, poster: embed.thumbnail, sources: [{ src: hlsUrl || blobVideoUrl, type: hlsUrl ? 'application/x-mpegURL' : 'video/mp4' }], loop: true, muted: true, playsinline: true };
      return <SharedVideoPlayer options={playerOptions} className="w-full h-auto bg-black rounded-lg" />;
    }

    return null;
  };
  
  if (isLoading || !moderation.isReady) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#A8C7FA" /></View>;
  }
  
  if (error || !thread || !postAuthor) {
    return <View style={[styles.centered, styles.container]}><Text style={styles.errorText}>{error || t('post.notFound')}</Text></View>;
  }

  const mainPost = thread.post;
  const modDecision = moderatePost(mainPost, moderation);
  
  const PageHeader = () => (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
                <ArrowLeft size={20} color="#E2E2E6" />
            </Pressable>
            <Link href={`/profile/${postAuthor.handle}` as any} asChild>
                <Pressable style={styles.authorInfo}>
                    <Image source={{ uri: postAuthor.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                    <View style={styles.authorTextContainer}>
                        <View style={styles.authorNameContainer}>
                           <Text style={styles.authorName} numberOfLines={1}>{postAuthor.displayName || `@${postAuthor.handle}`}</Text>
                           {postAuthor.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                                <BadgeCheck size={16} color="#A8C7FA" fill="currentColor" />
                            )}
                        </View>
                    </View>
                </Pressable>
            </Link>
        </View>
        <Pressable onPress={() => openMediaActionsModal(mainPost)} style={styles.headerButton}>
            <MoreHorizontal size={20} color="#E2E2E6"/>
        </Pressable>
      </View>
  );

  if (modDecision.visibility === 'hide') {
    return (
        <View style={{flex: 1}}>
            <PageHeader />
            <View style={[styles.container, styles.centered, { backgroundColor: '#1E2021', margin: 16, borderRadius: 12}]}>
                <ShieldAlert size={40} color="#C3C6CF" style={{ marginBottom: 16 }} />
                <Text style={styles.modTitle}>Post hidden</Text>
                <Text style={styles.modReason}>{modDecision.reason}</Text>
            </View>
        </View>
    )
  }

  if (modDecision.visibility === 'warn' && !isContentVisible) {
    return (
         <View style={{flex: 1}}>
            <PageHeader />
            <View style={styles.container}>
                <ContentWarning 
                    reason={modDecision.reason!}
                    onShow={() => setIsContentVisible(true)}
                />
            </View>
        </View>
    )
  }

  const currentRecord = mainPost.record as { text: string, facets?: RichText['facets'], createdAt: string };
  const allReplies = (thread.replies || []).filter(reply => AppBskyFeedDefs.isThreadViewPost(reply)) as AppBskyFeedDefs.ThreadViewPost[];
  
  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        <meta property="og:type" content="article" />
      </Head>
      <View style={{ flex: 1, paddingBottom: Platform.OS === 'web' ? 0 : 80 }}>
        <PageHeader />
        <ScrollView contentContainerStyle={styles.container}>
            {renderMedia(mainPost)}
            {currentRecord.text && (
                <Text style={styles.postText}>
                    <RichTextRenderer record={currentRecord} />
                </Text>
            )}
            <Text style={styles.dateText}>{format(new Date(currentRecord.createdAt), "h:mm a · MMM d, yyyy")}</Text>
            
            {Platform.OS === 'web' && <PostScreenActionBar post={mainPost} />}
          
            <View style={{marginTop: 16}}>
                {(mainPost.replyCount || 0) > 0 ? (
                <>
                    <Text style={styles.repliesHeader}>
                        {mainPost.replyCount} {t(mainPost.replyCount === 1 ? 'common.reply' : 'common.replies')}
                    </Text>
                    {allReplies.length > 0 && <Reply reply={thread} isRoot={true} />}
                </>
                ) : (
                <View style={styles.noRepliesContainer}>
                    <MessageSquareDashed size={40} color="#8A9199" style={{ marginBottom: 16 }}/>
                    <Text style={styles.noRepliesText}>{t('post.noReplies')}</Text>
                </View>
                )}
            </View>
        </ScrollView>
        {Platform.OS !== 'web' && <PostScreenActionBar post={mainPost} />}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { padding: 16 },
    errorText: { color: '#F2B8B5', fontSize: 16 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 64, paddingHorizontal: 16, backgroundColor: '#111314' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
    headerButton: { padding: 8, margin: -8, borderRadius: 999 },
    authorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2b2d2e' },
    authorTextContainer: { flex: 1, minWidth: 0 },
    authorNameContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    authorName: { fontWeight: 'bold', color: '#E2E2E6', fontSize: 16 },
    modTitle: { fontWeight: 'bold', fontSize: 16, color: '#E2E2E6' },
    modReason: { color: '#C3C6CF', textTransform: 'capitalize' },
    carouselImage: { height: 350, backgroundColor: 'black' },
    carouselCounter: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
    carouselCounterText: { color: 'white', fontSize: 12, fontWeight: '600' },
    postText: { marginVertical: 12, color: '#E2E2E6', fontSize: 16, lineHeight: 24 },
    dateText: { fontSize: 14, color: '#C3C6CF', marginVertical: 12 },
    repliesHeader: { fontSize: 18, fontWeight: 'bold', color: '#E2E2E6', paddingTop: 16, paddingBottom: 8 },
    noRepliesContainer: { alignItems: 'center', padding: 32, backgroundColor: '#1E2021', borderRadius: 12, marginTop: 16 },
    noRepliesText: { fontWeight: '600', color: '#E2E2E6' },
});

export default PostScreen;
