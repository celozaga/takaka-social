import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, FlatList, Alert, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AppBskyActorDefs, AppBskyFeedDefs,AtUri,RichText,AppBskyEmbedImages,AppBskyEmbedVideo, ComAtprotoLabelDefs } from '@atproto/api';
import PostCard from '../post/PostCard';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { MoreHorizontal, UserPlus, UserCheck, MicOff, Shield, ShieldOff, BadgeCheck, ArrowLeft, Grid, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useUI } from '../../context/UIContext';
import Head from '../shared/Head';
import Label from '../shared/Label';
import ProfileHeader from './ProfileHeader';

type FeedFilter = 'all' | 'photos' | 'videos';

const isPostAMediaPost = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    if (!embed) return false;
    return (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) || AppBskyEmbedVideo.isView(embed);
};

const hasPhotos = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    if (!embed) return false;
    return AppBskyEmbedImages.isView(embed) && embed.images.length > 0;
}

const hasVideos = (post: AppBskyFeedDefs.PostView): boolean => {
    const embed = post.embed;
    if (!embed) return false;
    return AppBskyEmbedVideo.isView(embed);
}

const filterPosts = (posts: AppBskyFeedDefs.FeedViewPost[], filter: FeedFilter): AppBskyFeedDefs.FeedViewPost[] => {
    const baseFiltered = posts.filter(item => !item.reply && isPostAMediaPost(item.post));
    switch (filter) {
        case 'all': return baseFiltered;
        case 'photos': return baseFiltered.filter(item => hasPhotos(item.post));
        case 'videos': return baseFiltered.filter(item => hasVideos(item.post));
        default: return baseFiltered;
    }
};

const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { t } = useTranslation();
    const { toast } = useToast();
    const router = useRouter();
    const { openEditProfileModal, setCustomFeedHeaderVisible } = useUI();
    const { getProfile } = useProfileCache();

    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [viewerState, setViewerState] = useState<AppBskyActorDefs.ViewerState | undefined>(undefined);
    const [feed, setFeed] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [descriptionWithFacets, setDescriptionWithFacets] = useState<{ text: string, facets: RichText['facets'] | undefined } | null>(null);
    const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
    
    const isMe = session?.did === profile?.did;

    useEffect(() => { setCustomFeedHeaderVisible(true); return () => setCustomFeedHeaderVisible(false); }, [setCustomFeedHeaderVisible]);

    const handleFollow = async () => { /* ... */ };
    const handleUnfollow = async () => { /* ... */ };

    const handleAction = async (actionFn: () => Promise<any>, { successMsg, errorMsg }: { successMsg: string, errorMsg: string }) => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        setIsMenuOpen(false);
        const oldViewerState = viewerState;
        try {
            await actionFn();
            toast({ title: successMsg });
        } catch(e) {
            console.error(errorMsg, e);
            toast({ title: "Error", description: errorMsg, variant: "destructive" });
            setViewerState(oldViewerState); // Revert optimistic update on failure
        } finally {
            setIsActionLoading(false);
        }
    }

    const handleMuteToggle = () => {
        if (!profile) return;
        const isMuted = !!viewerState?.muted;
        setViewerState(prev => prev ? { ...prev, muted: !isMuted } : undefined);
        handleAction(
            () => isMuted ? agent.unmute(profile.did) : agent.mute(profile.did),
            { successMsg: isMuted ? t('profile.toast.unmuteSuccess') : t('profile.toast.muteSuccess', {handle: profile.handle}), errorMsg: isMuted ? t('profile.toast.unmuteError') : t('profile.toast.muteError') }
        );
    };

    const handleBlockToggle = () => {
        if (!profile || !session) return;
        const isBlocked = !!viewerState?.blocking;
        const confirmAndAct = () => {
            setViewerState(prev => prev ? { ...prev, blocking: isBlocked ? undefined : 'temp-uri', following: undefined } : undefined);
            handleAction(
                async () => {
                    if (isBlocked) {
                        await agent.app.bsky.graph.block.delete({ repo: session.did, rkey: new AtUri(viewerState!.blocking!).rkey });
                    } else {
                        const { uri } = await agent.app.bsky.graph.block.create({ repo: session.did }, { subject: profile.did, createdAt: new Date().toISOString() });
                        setViewerState(prev => prev ? { ...prev, blocking: uri } : undefined);
                    }
                },
                { successMsg: isBlocked ? t('profile.toast.unblockSuccess') : t('profile.toast.blockSuccess'), errorMsg: isBlocked ? t('profile.toast.unblockError') : t('profile.toast.blockError') }
            );
        }
        
        if (!isBlocked) {
            if (Platform.OS === 'web') {
                 if (window.confirm(t('profile.confirmBlock', { handle: profile.handle }))) confirmAndAct();
            } else {
                Alert.alert("Block User", t('profile.confirmBlock', { handle: profile.handle }), [{ text: "Cancel", style: "cancel"}, { text: "Block", style: "destructive", onPress: confirmAndAct}]);
            }
        } else {
            confirmAndAct();
        }
    };
    
    const fetchProfileAndFeed = useCallback(async (currentCursor?: string) => {
        if (!currentCursor) {
            setIsLoading(true);
            setError(null); setFeed([]); setCursor(undefined); setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }
        try {
            if (!currentCursor) {
                const profileRes = await getProfile(actor);
                setProfile(profileRes);
                setViewerState(profileRes.viewer);
                if (profileRes.viewer?.blocking || profileRes.viewer?.blockedBy) {
                    setHasMore(false); setIsLoading(false); return;
                }
            }
            const feedRes = await agent.getAuthorFeed({ actor, limit: 30, cursor: currentCursor });
            setFeed(prevFeed => [...prevFeed, ...feedRes.data.feed]);
            if (feedRes.data.cursor && feedRes.data.feed.length > 0) {
                setCursor(feedRes.data.cursor); setHasMore(true);
            } else {
                setHasMore(false);
            }
        } catch (err: any) {
            if (err.error === 'BlockedByActor') setError(t('profile.blockedBy'));
            else setError(err.message || t('profile.loadingError'));
        } finally {
            setIsLoading(false); setIsLoadingMore(false);
        }
    }, [agent, actor, getProfile, t]);

    useEffect(() => { fetchProfileAndFeed(); }, [fetchProfileAndFeed]);
    
    useEffect(() => {
        if (profile?.description) {
            const rt = new RichText({ text: profile.description });
            rt.detectFacets(agent).then(() => setDescriptionWithFacets({ text: rt.text, facets: rt.facets }));
        } else {
            setDescriptionWithFacets(null);
        }
    }, [profile?.description, agent]);
    
    const displayedFeed = useMemo(() => filterPosts(feed, activeFilter), [feed, activeFilter]);

    const renderHeader = () => (
      <View style={{backgroundColor: '#111314'}}>
        {profile?.banner && <Image source={{ uri: profile.banner }} style={styles.banner} />}
        <View style={styles.profileInfoContainer}>
            <View style={styles.avatarContainer}>
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                <View style={styles.statsContainer}>
                    <Link href={`/profile/${actor}/following` as any} asChild><Pressable style={styles.statItem}><Text style={styles.statNumber}>{profile.followsCount}</Text><Text style={styles.statLabel}>{t('common.following')}</Text></Pressable></Link>
                    <Link href={`/profile/${actor}/followers` as any} asChild><Pressable style={styles.statItem}><Text style={styles.statNumber}>{profile.followersCount}</Text><Text style={styles.statLabel}>{t('common.followers')}</Text></Pressable></Link>
                    <View style={styles.statItem}><Text style={styles.statNumber}>{profile.postsCount}</Text><Text style={styles.statLabel}>{t('common.posts')}</Text></View>
                </View>
            </View>
            <View style={styles.detailsContainer}>
                <View style={styles.nameContainer}>
                    <Text style={styles.displayName}>{profile.displayName || `@${profile.handle}`}</Text>
                    {profile.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && <BadgeCheck size={20} color="#A8C7FA" fill="currentColor" />}
                </View>
                {descriptionWithFacets && <Text style={styles.description}><RichTextRenderer record={descriptionWithFacets} /></Text>}
                {profile.labels && ComAtprotoLabelDefs.isLabel(profile.labels[0]) && profile.labels.length > 0 && (
                    <View style={styles.labelsContainer}>{profile.labels.map((label) => <Label key={label.val} label={label} />)}</View>
                )}
                <View style={styles.actionsContainer}>
                    {isMe ? (
                        <Pressable onPress={openEditProfileModal} style={styles.actionButton}><Text style={styles.actionButtonText}>{t('common.editProfile')}</Text></Pressable>
                    ) : session && viewerState && (
                        <Pressable onPress={viewerState?.following ? handleUnfollow : handleFollow} disabled={isActionLoading} style={[styles.actionButton, !viewerState?.following && styles.followButton]}><Text style={[styles.actionButtonText, !viewerState?.following && styles.followButtonText]}>{t(viewerState?.following ? 'common.following' : 'common.follow')}</Text></Pressable>
                    )}
                </View>
            </View>
        </View>
        <View style={styles.filterBar}>
            <Pressable onPress={() => setActiveFilter('all')} style={[styles.filterButton, activeFilter === 'all' && styles.activeFilter]}><Grid size={22} color={activeFilter === 'all' ? '#E2E2E6' : '#C3C6CF'} /></Pressable>
            <Pressable onPress={() => setActiveFilter('photos')} style={[styles.filterButton, activeFilter === 'photos' && styles.activeFilter]}><ImageIcon size={22} color={activeFilter === 'photos' ? '#E2E2E6' : '#C3C6CF'} /></Pressable>
            <Pressable onPress={() => setActiveFilter('videos')} style={[styles.filterButton, activeFilter === 'videos' && styles.activeFilter]}><VideoIcon size={22} color={activeFilter === 'videos' ? '#E2E2E6' : '#C3C6CF'} /></Pressable>
        </View>
      </View>
    );

    if (isLoading && feed.length === 0) return <View style={styles.centered}><ActivityIndicator size="large" color="#A8C7FA" /></View>;
    if (error || !profile) return <View style={styles.centered}><Text style={styles.errorText}>{error || t('profile.notFound')}</Text></View>;
    
    if (viewerState?.blocking) { /* ... Blocked UI ... */ }

    return (
        <>
            <Head><title>{profile.displayName || profile.handle}</title></Head>
            <ProfileHeader handle={profile.handle} onMoreClick={() => setIsMenuOpen(true)} />
            <FlatList
                data={displayedFeed}
                renderItem={({ item }) => <PostCard feedViewPost={item} />}
                keyExtractor={(item) => item.post.cid}
                numColumns={2}
                ListHeaderComponent={renderHeader}
                columnWrapperStyle={styles.columnWrapper}
                onEndReached={() => fetchProfileAndFeed(cursor)}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => {
                    if (isLoadingMore) return <ActivityIndicator size="large" style={{ margin: 20 }} />;
                    if (!hasMore && displayedFeed.length > 0) return <Text style={styles.endOfList}>{t('common.endOfList')}</Text>;
                    return null;
                }}
                ListEmptyComponent={() => (
                    !isLoadingMore && !hasMore && <View style={styles.emptyContainer}><Text style={styles.emptyText}>{t('profile.emptyFeed', { mediaType: activeFilter !== 'all' ? t(`common.${activeFilter}`) : t('common.media') })}</Text></View>
                )}
            />
        </>
    );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#F2B8B5' },
    banner: { width: '100%', height: 150, backgroundColor: '#2b2d2e' },
    profileInfoContainer: { padding: 16 },
    avatarContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -48 },
    avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#2b2d2e', borderWidth: 4, borderColor: '#111314' },
    statsContainer: { flexDirection: 'row', gap: 16 },
    statItem: { alignItems: 'center' },
    statNumber: { fontWeight: 'bold', fontSize: 16, color: '#E2E2E6' },
    statLabel: { color: '#C3C6CF', fontSize: 14 },
    detailsContainer: { marginTop: 12 },
    nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    displayName: { fontSize: 24, fontWeight: 'bold', color: '#E2E2E6' },
    description: { marginTop: 4, color: '#E2E2E6', fontSize: 14, lineHeight: 20 },
    labelsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    actionsContainer: { marginTop: 16, flexDirection: 'row', gap: 8 },
    actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2b2d2e', alignItems: 'center' },
    actionButtonText: { fontWeight: 'bold', color: '#E2E2E6' },
    followButton: { backgroundColor: '#A8C7FA' },
    followButtonText: { color: '#003258' },
    filterBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2b2d2e' },
    filterButton: { flex: 1, padding: 12, alignItems: 'center' },
    activeFilter: { borderBottomWidth: 2, borderBottomColor: '#A8C7FA' },
    columnWrapper: { gap: 16, paddingHorizontal: 16 },
    endOfList: { textAlign: 'center', color: '#C3C6CF', padding: 32 },
    emptyContainer: { padding: 32, margin: 16, backgroundColor: '#1E2021', borderRadius: 12, alignItems: 'center' },
    emptyText: { color: '#C3C6CF' },
});

export default ProfileScreen;