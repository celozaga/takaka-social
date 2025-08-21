import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TextInput, FlatList, ScrollView, useWindowDimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Repeat, MessageSquare, Bookmark, MoreHorizontal, Send, ChevronRight, Check } from 'lucide-react';
import theme from '@/lib/theme';
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
  const [optimisticValue, setOptimisticValue] = useState(initialValue);
  const [actualValue, setActualValue] = useState(initialValue);

  const setValue = (newValue: T, asyncAction: () => Promise<any>) => {
    setOptimisticValue(newValue);
    asyncAction().catch(() => {
      // Revert on failure
      setOptimisticValue(actualValue);
    });
  };

  useEffect(() => {
    setOptimisticValue(initialValue);
    setActualValue(initialValue);
  }, [initialValue]);

  return [optimisticValue, setValue, setActualValue] as const;
};

const formatDistance = (dateStr: string) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = now.getTime() - then.getTime();
    const diffSeconds = Math.round(diff / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};


// --- SUB-COMPONENTS ---

const PostHeader: React.FC<{ post: Post, adapters: Adapters }> = ({ post, adapters }) => {
    const router = useRouter();
    const [isFollowing, setFollow] = useOptimisticState(post.followedAuthor);

    return (
        <View style={styles.header}>
            <Pressable style={styles.headerAuthor} onPress={() => adapters.onOpenProfile(post.author)}>
                <Image source={{ uri: post.author.avatar }} style={styles.headerAvatar} />
                <View>
                    <Text style={styles.headerDisplayName}>{post.author.displayName}</Text>
                    <Text style={styles.headerHandle}>@{post.author.handle}</Text>
                </View>
            </Pressable>
            <View style={styles.headerActions}>
                <Pressable onPress={() => setFollow(!isFollowing, () => adapters.onFollow(post.author.did, !isFollowing))} style={[styles.followButton, isFollowing && styles.followingButton]}>
                    <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>{isFollowing ? 'Following' : 'Follow'}</Text>
                </Pressable>
                <Pressable onPress={() => alert('More actions!')}>
                    <MoreHorizontal color={theme.color.textSecondary} size={24} />
                </Pressable>
                <Pressable onPress={() => router.back()}>
                    <ChevronRight color={theme.color.textPrimary} size={28} />
                </Pressable>
            </View>
        </View>
    );
};

const PostMedia: React.FC<{ post: Post, onLike: () => void }> = ({ post, onLike }) => {
    const { width } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;
    
    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index);
        }
    }, []);

    const mediaAspectRatio = post.media[0] ? post.media[0].width / post.media[0].height : 1;
    const mediaContainerWidth = Math.min(width, 720) - (theme.spacing.md * 2);

    return (
        <View style={{ marginHorizontal: theme.spacing.md }}>
            <FlatList
                data={post.media}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.url}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => (
                    <Pressable onPress={onLike}>
                        <Image source={{ uri: item.url }} style={[styles.mediaImage, { width: mediaContainerWidth, aspectRatio: mediaAspectRatio }]} />
                    </Pressable>
                )}
            />
            {post.media.length > 1 &&
                <View style={styles.mediaCounter}>
                    <Text style={styles.mediaCounterText}>{activeIndex + 1}/{post.media.length}</Text>
                </View>
            }
        </View>
    );
};

const PostContent: React.FC<{ post: Post }> = ({ post }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // This is a simplified check. A real implementation would use onTextLayout.
    const isLongText = post.text.length > 150;
    
    return (
        <View style={styles.contentContainer}>
            {post.title && <Text style={styles.contentTitle}>{post.title}</Text>}
            <Text style={styles.contentText} numberOfLines={isExpanded ? undefined : 3}>
                {post.text}
            </Text>
            {isLongText && !isExpanded &&
                <Pressable onPress={() => setIsExpanded(true)}>
                    <Text style={styles.seeMoreText}>... See more</Text>
                </Pressable>
            }
            <Text style={styles.timestamp}>{formatDistance(post.createdAt)} in {post.location}</Text>
        </View>
    );
};

const CommentCell: React.FC<{ comment: Comment, adapters: Adapters, postAuthorDid: string }> = ({ comment, adapters, postAuthorDid }) => {
    const [isLiked, setLiked] = useOptimisticState(comment.liked);
    const [likeCount, setLikeCount] = useOptimisticState(comment.likeCount);
    const [areRepliesExpanded, setAreRepliesExpanded] = useState(false);

    const handleLikeToggle = () => {
        const nextLiked = !isLiked;
        const nextLikeCount = likeCount + (nextLiked ? 1 : -1);
        setLiked(nextLiked, () => adapters.onLike(comment.uri, nextLiked));
        setLikeCount(nextLikeCount, () => adapters.onLike(comment.uri, nextLiked));
    };

    const isOp = comment.author.did === postAuthorDid;

    return (
        <View style={styles.commentCell}>
            <Image source={{ uri: comment.author.avatar }} style={styles.commentAvatar} />
            <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthorName}>{comment.author.displayName}</Text>
                    {isOp && <Text style={styles.opBadge}>Author</Text>}
                    <Text style={styles.commentTimestamp}>{formatDistance(comment.createdAt)}</Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
                {comment.children && comment.children.length > 0 &&
                    <View style={styles.repliesContainer}>
                        {comment.children.slice(0, areRepliesExpanded ? undefined : 1).map(reply => (
                           <CommentCell key={reply.uri} comment={reply} adapters={adapters} postAuthorDid={postAuthorDid} />
                        ))}
                        {comment.children.length > 1 && !areRepliesExpanded &&
                            <Pressable onPress={() => setAreRepliesExpanded(true)}>
                                <Text style={styles.viewRepliesText}>View more replies ({comment.children.length - 1})</Text>
                            </Pressable>
                        }
                    </View>
                }
            </View>
            <Pressable style={styles.commentLikeButton} onPress={handleLikeToggle}>
                <Heart size={18} color={isLiked ? theme.color.accent : theme.color.textTertiary} fill={isLiked ? theme.color.accent : 'transparent'} />
                <Text style={styles.commentLikeCount}>{likeCount > 0 ? likeCount : ''}</Text>
            </Pressable>
        </View>
    );
};


const PostComposer: React.FC<{ post: Post, adapters: Adapters }> = ({ post, adapters }) => {
    const insets = useSafeAreaInsets();
    const [text, setText] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    const [isLiked, setLiked] = useOptimisticState(post.liked);
    const [isReposted, setReposted] = useOptimisticState(post.reposted);

    const handleSend = async () => {
        if (!text.trim() || isSending) return;
        setIsSending(true);
        await adapters.onReply(post.uri, text);
        setText('');
        setIsSending(false);
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
             <View style={[styles.composerContainer, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
                <View style={styles.composerInputWrapper}>
                    <TextInput
                        style={styles.composerInput}
                        placeholder="Say something..."
                        placeholderTextColor={theme.color.textTertiary}
                        value={text}
                        onChangeText={setText}
                        multiline
                    />
                </View>
                <View style={styles.composerActions}>
                     <Pressable style={styles.composerActionButton} onPress={() => setLiked(!isLiked, () => adapters.onLike(post.uri, !isLiked))}>
                        <Heart size={24} color={isLiked ? theme.color.accent : theme.color.textSecondary} fill={isLiked ? theme.color.accent : 'transparent'}/>
                    </Pressable>
                     <Pressable style={styles.composerActionButton} onPress={() => setReposted(!isReposted, () => adapters.onRepost(post.uri, !isReposted))}>
                        <Repeat size={24} color={isReposted ? theme.color.accent : theme.color.textSecondary} />
                    </Pressable>
                    <Pressable style={styles.composerActionButton} onPress={() => { /* Open comment list */ }}>
                        <MessageSquare size={24} color={theme.color.textSecondary} />
                    </Pressable>
                    {text.trim().length > 0 &&
                        <Pressable onPress={handleSend} disabled={isSending} style={[styles.sendButton, isSending && { opacity: 0.5 }]}>
                            {isSending ? <ActivityIndicator color="white" size="small"/> : <Send size={20} color="white" />}
                        </Pressable>
                    }
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};


// --- MAIN SCREEN COMPONENT ---

export default function PostScreen({ post, initialComments, adapters }: PostScreenProps) {
  const [comments, setComments] = useState(initialComments);
  const [isLiked, setLiked] = useOptimisticState(post.liked);
  const likeAnimation = useRef(new Animated.Value(0)).current;

  const handleDoubleTapLike = () => {
      if (!isLiked) {
          setLiked(true, () => adapters.onLike(post.uri, true));
      }
      likeAnimation.setValue(1);
      Animated.sequence([
        Animated.spring(likeAnimation, { toValue: 1.5, useNativeDriver: true }),
        Animated.spring(likeAnimation, { toValue: 1, useNativeDriver: true }),
        Animated.timing(likeAnimation, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
  };

  const ListHeader = useMemo(() => (
    <View>
      <PostMedia post={post} onLike={handleDoubleTapLike} />
      <PostContent post={post} />
      <View style={styles.divider} />
      <Text style={styles.commentsHeader}>Comments ({post.replyCount})</Text>
    </View>
  ), [post, isLiked]);

  return (
    <View style={styles.container}>
      <PostHeader post={post} adapters={adapters} />
      <FlatList
        data={comments}
        keyExtractor={item => item.uri}
        renderItem={({ item }) => <CommentCell comment={item} adapters={adapters} postAuthorDid={post.author.did} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 150 }}
        ItemSeparatorComponent={() => <View style={styles.commentDivider} />}
      />
      <PostComposer post={post} adapters={adapters} />

      <Animated.View style={[styles.likeHeartOverlay, { opacity: likeAnimation, transform: [{ scale: likeAnimation }] }]}>
          <Heart size={100} color="white" fill="white" />
      </Animated.View>
    </View>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    height: 56,
  },
  headerAuthor: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerDisplayName: { color: theme.color.textPrimary, fontWeight: '600', fontSize: 16 },
  headerHandle: { color: theme.color.textSecondary, fontSize: 13 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  followButton: {
    backgroundColor: theme.color.brand,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: theme.color.line,
    borderWidth: 1,
  },
  followButtonText: { color: 'white', fontWeight: 'bold' },
  followingButtonText: { color: theme.color.textSecondary },
  mediaImage: { borderRadius: theme.radius.lg, backgroundColor: theme.color.card },
  mediaCounter: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  mediaCounterText: { color: 'white', fontSize: theme.font.tiny, fontWeight: 'bold' },
  contentContainer: { padding: theme.spacing.md },
  contentTitle: { color: theme.color.textPrimary, fontSize: theme.font.title, fontWeight: 'bold', marginBottom: theme.spacing.xs },
  contentText: { color: theme.color.textPrimary, fontSize: theme.font.body, lineHeight: 22 },
  seeMoreText: { color: theme.color.textSecondary, fontWeight: 'bold', marginTop: theme.spacing.xs },
  timestamp: { color: theme.color.textTertiary, fontSize: theme.font.small, marginTop: theme.spacing.md },
  divider: { height: 1, backgroundColor: theme.color.line, margin: theme.spacing.md },
  commentsHeader: {
    color: theme.color.textSecondary,
    fontSize: theme.font.small,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  commentDivider: { height: 1, backgroundColor: theme.color.line, marginLeft: theme.spacing.md + 32 + theme.spacing.sm },
  composerContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: theme.color.bg,
    borderTopWidth: 1,
    borderTopColor: theme.color.line,
    padding: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  composerInputWrapper: { flex: 1, backgroundColor: theme.color.inputBg, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs },
  composerInput: { color: theme.color.textPrimary, fontSize: 16, maxHeight: 100 },
  composerActions: { flexDirection: 'row', alignItems: 'center', paddingBottom: theme.spacing.xs, marginLeft: theme.spacing.sm },
  composerActionButton: { padding: theme.spacing.xs },
  sendButton: {
    marginLeft: theme.spacing.xs,
    backgroundColor: theme.color.brand,
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentCell: { flexDirection: 'row', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, gap: theme.spacing.sm },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  commentAuthorName: { color: theme.color.textSecondary, fontWeight: '600' },
  commentTimestamp: { color: theme.color.textTertiary, fontSize: theme.font.tiny },
  opBadge: { backgroundColor: theme.color.badge, color: theme.color.textSecondary, fontSize: 10, borderRadius: 4, paddingHorizontal: 4, overflow: 'hidden'},
  commentText: { color: theme.color.textPrimary, marginTop: theme.spacing.xxs },
  commentLikeButton: { alignItems: 'center', gap: theme.spacing.xxs, paddingTop: theme.spacing.xxs },
  commentLikeCount: { color: theme.color.textTertiary, fontSize: theme.font.tiny },
  repliesContainer: { marginTop: theme.spacing.sm },
  viewRepliesText: { color: theme.color.textSecondary, fontWeight: '600', marginTop: theme.spacing.xs },
  likeHeartOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  }
});