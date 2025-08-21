import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TextInput, FlatList, useWindowDimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Repeat, MessageSquare, MoreHorizontal, Send } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useRouter } from 'expo-router';

// --- TYPE DEFINITIONS ---
export interface ProfileLink { did: string; handle: string; displayName: string; avatar: string; verified?: boolean; }
export interface Media { type: "image" | "video"; url: string; width: number; height: number; thumbnail?: string; }
export interface Post {
  uri: string; cid: string;
  author: ProfileLink;
  title?: string;
  text: string;
  media: Media[];
  tags?: string[]; location?: string; lang?: string;
  createdAt: string;
  likeCount: number; repostCount: number; replyCount: number; saved?: boolean; liked?: boolean; reposted?: boolean; followedAuthor?: boolean;
}
export interface Comment {
  uri: string; cid: string;
  author: ProfileLink;
  text: string; lang?: string;
  likeCount: number; liked?: boolean;
  createdAt: string;
  isAuthor?: boolean;
  children?: Comment[];
}
export type Adapters = {
  onOpenProfile(p: ProfileLink): void;
  onFollow(did: string, next: boolean): Promise<void>;
  onLike(uri: string, next: boolean): Promise<void>;
  onRepost(uri: string, next: boolean): Promise<void>;
  onReply(parentUri: string, text: string): Promise<void>;
  onShare(post: Post): void;
  onReport(uri: string): void;
  onTranslate(text: string, lang?: string): Promise<string>;
  loadMoreComments(cursor?: string): Promise<{ items: Comment[]; cursor?: string }>;
  loadMoreReplies(parentUri: string, cursor?: string): Promise<{ items: Comment[]; cursor?: string }>;
};

interface PostScreenProps {
  post: Post;
  initialComments: Comment[];
  adapters: Adapters;
}

// --- HELPER HOOKS & UTILS ---
const useOptimisticState = <T,>(initialValue: T) => {
  const [value, setValue] = useState(initialValue);
  const setOptimisticValue = (newValue: T, asyncAction: () => Promise<any>) => {
    const oldValue = value;
    setValue(newValue);
    asyncAction().catch(() => setValue(oldValue));
  };
  useEffect(() => setValue(initialValue), [initialValue]);
  return [value, setOptimisticValue] as const;
};

const formatDistance = (dateStr: string) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = now.getTime() - then.getTime();
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays} days ago`;
    const diffHours = Math.round(diff / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours} hours ago`;
    const diffMinutes = Math.round(diff / (1000 * 60));
    if (diffMinutes > 0) return `${diffMinutes} minutes ago`;
    return 'Just now';
};

const formatCount = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(num);
};


// --- SUB-COMPONENTS ---

const PostHeader: React.FC<{ post: Post, adapters: Adapters }> = React.memo(({ post, adapters }) => {
    const [isFollowing, setFollow] = useOptimisticState(post.followedAuthor);
    const handleFollow = () => setFollow(!isFollowing, () => adapters.onFollow(post.author.did, !isFollowing));

    return (
        <View style={styles.header}>
            <Pressable style={styles.headerAuthor} onPress={() => adapters.onOpenProfile(post.author)} accessibilityLabel={`View profile of ${post.author.displayName}`}>
                <Image source={{ uri: post.author.avatar }} style={styles.headerAvatar} />
                <Text style={styles.headerDisplayName} numberOfLines={1}>{post.author.displayName}</Text>
            </Pressable>
            <View style={styles.headerActions}>
                <Pressable onPress={handleFollow} style={[styles.followButton, isFollowing && styles.followingButton]} accessibilityLabel={isFollowing ? `Unfollow ${post.author.displayName}` : `Follow ${post.author.displayName}`}>
                    <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>{isFollowing ? 'Following' : 'Follow'}</Text>
                </Pressable>
                <Pressable onPress={() => adapters.onShare(post)} accessibilityLabel="Share post">
                    <MoreHorizontal color={theme.colors.textSecondary} size={24} />
                </Pressable>
            </View>
        </View>
    );
});

const PostMedia: React.FC<{ post: Post, onDoubleTapLike: () => void }> = React.memo(({ post, onDoubleTapLike }) => {
    const { width } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
    
    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index);
    }, []);

    const mediaAspectRatio = post.media[0] ? post.media[0].width / post.media[0].height : 1;
    const containerWidth = width;

    let lastTap: number | null = null;
    const handlePress = () => {
        const now = Date.now();
        if (lastTap && (now - lastTap) < 300) {
            onDoubleTapLike();
        }
        lastTap = now;
    };
    
    return (
        <View>
            <FlatList<Media>
                data={post.media}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.url}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => (
                    <Pressable onPress={handlePress}>
                        <Image source={{ uri: item.url }} style={[styles.mediaImage, { width: containerWidth, aspectRatio: mediaAspectRatio }]} />
                    </Pressable>
                )}
                style={{ width: containerWidth }}
            />
            {post.media.length > 1 && (
                <View style={styles.mediaDots}>
                    {post.media.map((_, index) => <View key={index} style={[styles.mediaDot, index === activeIndex && styles.mediaDotActive]} />)}
                </View>
            )}
        </View>
    );
});

const PostContent: React.FC<{ post: Post, adapters: Adapters }> = React.memo(({ post, adapters }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isLongText = post.text.length > 120;
    
    return (
        <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>{post.title}</Text>
            <Text style={styles.contentText} numberOfLines={isExpanded ? undefined : 2}>
                {post.text}
            </Text>
            {isLongText && !isExpanded &&
                <Pressable onPress={() => setIsExpanded(true)}>
                    <Text style={styles.seeMoreText}>... See more</Text>
                </Pressable>
            }
            <View style={styles.metaContainer}>
                <Text style={styles.timestamp}>{`${formatDistance(post.createdAt)} · ${post.location}`}</Text>
                <Pressable onPress={() => adapters.onTranslate(post.text, post.lang)}>
                    <Text style={styles.translateLink}>Translate</Text>
                </Pressable>
            </View>
        </View>
    );
});

const CommentCell: React.FC<{ comment: Comment, adapters: Adapters }> = React.memo(({ comment, adapters }) => {
    const [isLiked, setLiked] = useOptimisticState(comment.liked);
    const [likeCount, setLikeCount] = useOptimisticState(comment.likeCount);
    const [areRepliesExpanded, setAreRepliesExpanded] = useState(false);

    const handleLikeToggle = () => {
        const nextLiked = !isLiked;
        const nextLikeCount = likeCount + (nextLiked ? 1 : -1);
        setLiked(nextLiked, () => adapters.onLike(comment.uri, nextLiked));
        setLikeCount(nextLikeCount, () => adapters.onLike(comment.uri, nextLiked));
    };

    return (
        <View style={styles.commentCell}>
            <Image source={{ uri: comment.author.avatar }} style={styles.commentAvatar} />
            <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthorName}>{comment.author.displayName}</Text>
                    {comment.isAuthor && <Text style={styles.opBadge}>Author</Text>}
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.commentTimestamp}>{formatDistance(comment.createdAt)}</Text>
                {comment.children && comment.children.length > 0 &&
                    <View style={styles.repliesContainer}>
                        {comment.children.slice(0, areRepliesExpanded ? undefined : 1).map(reply => (
                           <CommentCell key={reply.uri} comment={reply} adapters={adapters} />
                        ))}
                        {comment.children.length > 1 && !areRepliesExpanded &&
                            <Pressable onPress={() => setAreRepliesExpanded(true)}>
                                <Text style={styles.viewRepliesText}>View {comment.children.length - 1} more replies</Text>
                            </Pressable>
                        }
                    </View>
                }
            </View>
            <Pressable style={styles.commentLikeButton} onPress={handleLikeToggle}>
                <Heart size={18} color={isLiked ? theme.colors.accent : theme.colors.textTertiary} fill={isLiked ? theme.colors.accent : 'transparent'} />
                {likeCount > 0 && <Text style={styles.commentLikeCount}>{formatCount(likeCount)}</Text>}
            </Pressable>
        </View>
    );
});

const PostComposer: React.FC<{ post: Post, adapters: Adapters, onComment: () => void }> = React.memo(({ post, adapters, onComment }) => {
    const insets = useSafeAreaInsets();
    const [text, setText] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    const [isLiked, setLiked] = useOptimisticState(post.liked);
    const [likeCount, setLikeCount] = useOptimisticState(post.likeCount);
    const [isReposted, setReposted] = useOptimisticState(post.reposted);
    const [repostCount, setRepostCount] = useOptimisticState(post.repostCount);
    
    const handleLike = () => {
        const next = !isLiked;
        setLiked(next, () => adapters.onLike(post.uri, next));
        setLikeCount(likeCount + (next ? 1 : -1), () => Promise.resolve());
    }
    const handleRepost = () => {
        const next = !isReposted;
        setReposted(next, () => adapters.onRepost(post.uri, next));
        setRepostCount(repostCount + (next ? 1 : -1), () => Promise.resolve());
    }

    const handleSend = async () => {
        if (!text.trim() || isSending) return;
        setIsSending(true);
        await adapters.onReply(post.uri, text);
        setText('');
        setIsSending(false);
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -insets.bottom}>
             <View style={[styles.composerContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : theme.spacing.m }]}>
                <Pressable style={styles.composerInputWrapper} onPress={onComment}>
                    <Text style={styles.composerPlaceholder}>Say something...</Text>
                </Pressable>
                
                <View style={styles.composerActions}>
                     <Pressable style={styles.composerActionButton} onPress={handleLike}>
                        <Heart size={24} color={isLiked ? theme.colors.accent : theme.colors.textSecondary} fill={isLiked ? theme.colors.accent : 'transparent'}/>
                        {likeCount > 0 && <Text style={styles.composerActionText}>{formatCount(likeCount)}</Text>}
                    </Pressable>
                     <Pressable style={styles.composerActionButton} onPress={handleRepost}>
                        <Repeat size={24} color={isReposted ? theme.colors.accent : theme.colors.textSecondary} />
                        {repostCount > 0 && <Text style={styles.composerActionText}>{formatCount(repostCount)}</Text>}
                    </Pressable>
                    <Pressable style={styles.composerActionButton} onPress={onComment}>
                        <MessageSquare size={24} color={theme.colors.textSecondary} />
                        {post.replyCount > 0 && <Text style={styles.composerActionText}>{formatCount(post.replyCount)}</Text>}
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
});


// --- MAIN SCREEN COMPONENT ---
export default function PostScreen({ post, initialComments, adapters }: PostScreenProps) {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState(initialComments);
  const [isLiked, setLiked] = useOptimisticState(post.liked);
  const likeAnimation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<Comment>>(null);

  const handleDoubleTapLike = () => {
      setLiked(true, () => adapters.onLike(post.uri, true));
      likeAnimation.setValue(1);
      Animated.spring(likeAnimation, { toValue: 1.5, useNativeDriver: true, friction: 3 }).start(() => {
        Animated.timing(likeAnimation, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      });
  };
  
  const scrollToComments = () => {
      flatListRef.current?.scrollToIndex({ index: 0, viewOffset: 100, viewPosition: 0 });
  };

  const ListHeader = useMemo(() => (
    <View>
      <PostMedia post={post} onDoubleTapLike={handleDoubleTapLike} />
      <PostContent post={post} adapters={adapters}/>
      <View style={styles.divider} />
      <Text style={styles.commentsHeader}>Comments ({formatCount(post.replyCount)})</Text>
    </View>
  ), [post, adapters, handleDoubleTapLike]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PostHeader post={post} adapters={adapters} />
      <FlatList<Comment>
        ref={flatListRef}
        data={comments}
        keyExtractor={item => item.uri}
        renderItem={({ item }) => <CommentCell comment={item} adapters={adapters} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={styles.commentDivider} />}
        showsVerticalScrollIndicator={false}
      />
      <PostComposer post={post} adapters={adapters} onComment={scrollToComments} />

      <Animated.View style={[styles.likeHeartOverlay, { opacity: likeAnimation, transform: [{ scale: likeAnimation }] }]} pointerEvents="none">
          <Heart size={100} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.8)" />
      </Animated.View>
    </SafeAreaView>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.m, },
  headerAuthor: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m, flexShrink: 1 },
  headerAvatar: { width: 40, height: 40, borderRadius: theme.shape.full },
  headerDisplayName: { color: theme.colors.textPrimary, fontWeight: '600', ...theme.typography.bodyLarge, flexShrink: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  followButton: { backgroundColor: theme.colors.brand, paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.s, borderRadius: theme.shape.full },
  followingButton: { backgroundColor: 'transparent', borderColor: theme.colors.line, borderWidth: 1 },
  followButtonText: { color: 'white', fontWeight: 'bold', ...theme.typography.bodySmall },
  followingButtonText: { color: theme.colors.textSecondary },
  
  mediaImage: { backgroundColor: theme.colors.card },
  mediaDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: theme.spacing.m, left: 0, right: 0 },
  mediaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 3 },
  mediaDotActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  
  contentContainer: { padding: theme.spacing.l },
  contentTitle: { color: theme.colors.textPrimary, ...theme.typography.titleLarge, marginBottom: theme.spacing.s },
  contentText: { color: theme.colors.textPrimary, ...theme.typography.bodyLarge },
  seeMoreText: { color: theme.colors.textSecondary, fontWeight: 'bold', marginTop: theme.spacing.s },
  metaContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.m },
  timestamp: { color: theme.colors.textTertiary, ...theme.typography.bodySmall },
  translateLink: { color: theme.colors.textSecondary, ...theme.typography.bodySmall, fontWeight: '600'},
  
  divider: { height: 1, backgroundColor: theme.colors.line, marginVertical: theme.spacing.xl, marginHorizontal: theme.spacing.l },
  commentsHeader: { color: theme.colors.textSecondary, ...theme.typography.bodySmall, paddingHorizontal: theme.spacing.l, marginBottom: theme.spacing.m },
  commentDivider: { height: 1, backgroundColor: theme.colors.line, marginLeft: theme.spacing.l + 32 + theme.spacing.m },

  composerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.line, padding: theme.spacing.m, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
  composerInputWrapper: { flex: 1, backgroundColor: theme.colors.inputBg, borderRadius: theme.shape.full, paddingHorizontal: theme.spacing.l, height: 44, justifyContent: 'center' },
  composerPlaceholder: { color: theme.colors.textTertiary, fontSize: 16 },
  composerActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.l },
  composerActionButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  composerActionText: { color: theme.colors.textSecondary, fontWeight: '600' },

  commentCell: { flexDirection: 'row', paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.m, gap: theme.spacing.m },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, flexWrap: 'wrap' },
  commentAuthorName: { color: theme.colors.textSecondary, fontWeight: '600' },
  opBadge: { backgroundColor: theme.colors.badge, color: theme.colors.textSecondary, fontSize: 10, borderRadius: 4, paddingHorizontal: 4, overflow: 'hidden'},
  commentText: { color: theme.colors.textPrimary, marginTop: theme.spacing.xs, ...theme.typography.bodyMedium },
  commentTimestamp: { color: theme.colors.textTertiary, ...theme.typography.labelSmall, marginTop: theme.spacing.s },
  commentLikeButton: { alignItems: 'center', gap: theme.spacing.xs, paddingTop: theme.spacing.xs, paddingLeft: theme.spacing.m },
  commentLikeCount: { color: theme.colors.textTertiary, ...theme.typography.labelSmall, fontWeight: '500' },
  
  repliesContainer: { marginTop: theme.spacing.m, paddingLeft: 4, borderLeftWidth: 2, borderLeftColor: theme.colors.line },
  viewRepliesText: { color: theme.colors.textSecondary, fontWeight: '600', marginTop: theme.spacing.m, marginLeft: theme.spacing.m },
  
  likeHeartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
});