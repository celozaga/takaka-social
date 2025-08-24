
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Modal, Linking, Alert, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { AppBskyActorDefs, RichText, AtUri } from '@atproto/api';
import Feed from '../shared/Feed';
import { BadgeCheck, MoreHorizontal, UserX, Shield, AlertTriangle, MicOff, Edit, X, ArrowLeft, Grid, Repeat, Frown } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useUI } from '../../context/UIContext';
import Head from '../shared/Head';
import TopAppBar from '../ui/TopAppBar';
import { theme } from '@/lib/theme';
import ProfileHeaderSkeleton from './ProfileHeaderSkeleton';
import PostCardSkeleton from '../post/PostCardSkeleton';
import { formatCompactNumber } from '@/lib/formatters';
import ErrorState from '../shared/ErrorState';

const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { t } = useTranslation();
    const router = useRouter();
    const { toast } = useToast();
    const { getProfile, clearProfile } = useProfileCache();
    const { openEditProfileModal } = useUI();

    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [descriptionWithFacets, setDescriptionWithFacets] = useState<{ text: string, facets: RichText['facets'] | undefined } | null>(null);
    
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'posts' | 'reposts'>('posts');


    const isMe = session?.did === profile?.did;
    
    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const profileData = await getProfile(actor);
            setProfile(profileData);
        } catch (err: any) {
            if (err.error === 'BlockedByActor') setError(t('profile.blockedBy'));
            else if (err.error === 'NotFound') setError(t('profile.notFound'));
            else setError(err.message || t('profile.loadingError'));
        } finally {
            setIsLoading(false);
        }
    }, [getProfile, actor, t]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        if (profile?.description) {
            const rt = new RichText({ text: profile.description });
            rt.detectFacets(agent).then(() => {
                setDescriptionWithFacets({ text: rt.text, facets: rt.facets });
            });
        } else {
            setDescriptionWithFacets(null);
        }
    }, [profile?.description, agent]);

    const handleFollowToggle = async () => {
        if (isActionLoading || !profile || !session) return;
        setIsActionLoading(true);
        try {
            if (profile.viewer?.following) {
                await agent.deleteFollow(profile.viewer.following);
            } else {
                await agent.follow(profile.did);
            }
            clearProfile(actor);
            const newProfile = await getProfile(actor);
            setProfile(newProfile);
        } catch (err) {
            toast({ title: profile.viewer?.following ? t('profile.toast.unfollowError') : t('profile.toast.followError'), variant: "destructive" });
        } finally {
            setIsActionLoading(false);
        }
    };

    const confirmAction = (title: string, message: string, onConfirm: () => void) => {
        if (Platform.OS === 'web') {
            if (window.confirm(message)) onConfirm();
        } else {
            Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', style: 'destructive', onPress: onConfirm }]);
        }
    }

    const handleMuteToggle = async () => {
        if(!profile) return;
        setIsActionsModalVisible(false);
        const isMuted = !!profile.viewer?.muted;
        try {
            if (isMuted) await agent.unmute(profile.did);
            else await agent.mute(profile.did);
            clearProfile(actor);
            const newProfile = await getProfile(actor);
            setProfile(newProfile);
            toast({ title: isMuted ? t('profile.toast.unmuteSuccess') : t('profile.toast.muteSuccess'), description: !isMuted ? t('profile.toast.muteSuccessDescription', { handle: profile.handle }) : undefined });
        } catch (e) {
            toast({ title: isMuted ? t('profile.toast.unmuteError') : t('profile.toast.muteError'), variant: "destructive" });
        }
    };
    
    const handleBlockToggle = async () => {
        if(!profile || !session) return;
        setIsActionsModalVisible(false);
        const isBlocked = !!profile.viewer?.blocking;
        const confirmAndExecute = async () => {
             try {
                if (isBlocked && profile.viewer?.blocking) {
                    await agent.app.bsky.graph.block.delete({ repo: session!.did, rkey: new AtUri(profile.viewer.blocking).rkey });
                } else {
                    await agent.app.bsky.graph.block.create({ repo: session!.did }, { subject: profile.did, createdAt: new Date().toISOString() });
                }
                clearProfile(actor);
                const newProfile = await getProfile(actor);
                setProfile(newProfile);
                toast({ title: isBlocked ? t('profile.toast.unblockSuccess') : t('profile.toast.blockSuccess') });
            } catch (e) {
                toast({ title: isBlocked ? t('profile.toast.unblockError') : t('profile.toast.blockError'), variant: "destructive" });
            }
        }
        if (isBlocked) {
            confirmAndExecute();
        } else {
            confirmAction(t('profile.block'), t('profile.confirmBlock', { handle: profile.handle }), confirmAndExecute);
        }
    };
    
    const ListHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.statsRow}>
                <Image source={{ uri: profile?.avatar }} style={styles.avatar} />
                <View style={styles.stats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{formatCompactNumber(profile?.postsCount ?? 0)}</Text>
                        <Text style={styles.statLabel}>{t('common.posts')}</Text>
                    </View>
                    <Link href={`/profile/${actor}/following`} asChild>
                        <Pressable style={styles.statItem}>
                            <Text style={styles.statNumber}>{formatCompactNumber(profile?.followsCount ?? 0)}</Text>
                            <Text style={styles.statLabel}>{t('common.following')}</Text>
                        </Pressable>
                    </Link>
                    <Link href={`/profile/${actor}/followers`} asChild>
                        <Pressable style={styles.statItem}>
                            <Text style={styles.statNumber}>{formatCompactNumber(profile?.followersCount ?? 0)}</Text>
                            <Text style={styles.statLabel}>{t('common.followers')}</Text>
                        </Pressable>
                    </Link>
                </View>
            </View>
            <View style={styles.detailsContainer}>
                <View style={styles.nameContainer}>
                    <Text style={styles.displayName}>{profile?.displayName || `@${profile?.handle}`}</Text>
                    {profile?.labels?.some(l => l.val === 'blue-check') && <BadgeCheck size={20} color={theme.colors.onSurface} fill={theme.colors.onSurface} />}
                </View>
                {descriptionWithFacets && <Text style={styles.description}><RichTextRenderer record={descriptionWithFacets} /></Text>}
            </View>
             {session && (
                <View style={styles.actionButtonContainer}>
                    {isMe ? (
                        <Pressable onPress={openEditProfileModal} style={[styles.actionButton, styles.editButton]}>
                            <Edit size={16} color={theme.colors.onSurface} />
                            <Text style={styles.actionButtonText}>{t('common.editProfile')}</Text>
                        </Pressable>
                    ) : (
                        <Pressable onPress={handleFollowToggle} disabled={isActionLoading} style={[styles.actionButton, profile?.viewer?.following ? styles.followingButton : styles.followButton]}>
                            {isActionLoading ? <ActivityIndicator color={profile?.viewer?.following ? theme.colors.onSurface : theme.colors.onPrimary} /> : <Text style={[styles.actionButtonText, !profile?.viewer?.following && styles.followButtonText]}>{t(profile?.viewer?.following ? 'common.following' : 'common.follow')}</Text>}
                        </Pressable>
                    )}
                </View>
             )}
            <View style={styles.filterContainer}>
                <Pressable style={styles.filterButton} onPress={() => setActiveFilter('posts')}>
                    <Grid size={24} color={activeFilter === 'posts' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                    {activeFilter === 'posts' && <View style={styles.activeIndicator} />}
                </Pressable>
                <Pressable style={styles.filterButton} onPress={() => setActiveFilter('reposts')}>
                    <Repeat size={24} color={activeFilter === 'reposts' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                    {activeFilter === 'reposts' && <View style={styles.activeIndicator} />}
                </Pressable>
            </View>
        </View>
    );

    if (isLoading) {
        return (
          <>
            <TopAppBar title={t('profile.title')} />
            <ProfileHeaderSkeleton />
            <View style={{ flexDirection: 'row', gap: theme.spacing.l, padding: theme.spacing.l, backgroundColor: theme.colors.background }}>
              <View style={{ flex: 1, gap: theme.spacing.l }}><PostCardSkeleton /><PostCardSkeleton /></View>
              <View style={{ flex: 1, gap: theme.spacing.l }}><PostCardSkeleton /><PostCardSkeleton /></View>
            </View>
          </>
        );
    }
    if (error) {
        const isNotFound = error === t('profile.notFound');
        const isBlocked = error === t('profile.blockedBy');
        
        if (isBlocked) { // BlockedBy has a special, simpler UI. Keep it.
            return (
                <View style={{flex: 1}}>
                    <TopAppBar title={actor} />
                    <View style={styles.centered}><Shield size={48} color={theme.colors.onSurfaceVariant} /><Text style={styles.blockedTitle}>{t('profile.blockedBy')}</Text></View>
                </View>
            )
        }

        // Handle other errors with the new component
        return (
            <View style={styles.container}>
                <TopAppBar 
                    title={isNotFound ? t('profile.notFound') : t('common.error')}
                    leading={<Pressable onPress={() => router.back()} style={styles.headerButton}><ArrowLeft size={24} color={theme.colors.onSurface} /></Pressable>}
                />
                <View style={{ flex: 1 }}>
                    <ErrorState
                        icon={isNotFound ? UserX : Frown}
                        title={isNotFound ? t('errors.profileNotFound.title') : t('errors.genericError.title')}
                        message={isNotFound ? t('errors.profileNotFound.message') : t('errors.genericError.message')}
                        onRetry={fetchProfile}
                    />
                </View>
            </View>
        );
    }
    if (!profile) return null; // Should be covered by error state
    
    const profileUrl = `https://bsky.app/profile/${profile.handle}`;
    const truncatedDescription = profile.description ? (profile.description.length > 155 ? profile.description.substring(0, 155) + '...' : profile.description) : `View the profile of ${profile.displayName || `@${profile.handle}`} on Takaka.`;

    if (profile.viewer?.blockedBy) return <><TopAppBar title={profile.handle} /><View style={styles.centered}><Shield size={48} color={theme.colors.onSurfaceVariant} /><Text style={styles.blockedTitle}>{t('profile.blockedBy')}</Text></View></>;

    if (profile.viewer?.blocking) {
        return (
            <>
                <TopAppBar title={`@${profile.handle}`} />
                <View style={[styles.centered, {justifyContent: 'flex-start', paddingTop: 32}]}>
                    <UserX size={48} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.blockedTitle}>{t('profile.blockedUser', { handle: profile.handle })}</Text>
                    <Text style={styles.blockedDescription}>{t('profile.blockedUserDescription')}</Text>
                    <Pressable onPress={handleBlockToggle} style={[styles.actionButton, styles.unblockButton]}><Text style={styles.actionButtonText}>{t('profile.unblock')}</Text></Pressable>
                </View>
            </>
        )
    }

    return (
        <>
            <Head>
                <title>{`${profile.displayName || `@${profile.handle}`} | Takaka`}</title>
                <meta name="description" content={truncatedDescription} />
                {/* Open Graph Tags */}
                <meta property="og:title" content={`${profile.displayName || `@${profile.handle}`}`} />
                <meta property="og:description" content={truncatedDescription} />
                <meta property="og:url" content={profileUrl} />
                <meta property="og:type" content="profile" />
                {profile.avatar && <meta property="og:image" content={profile.avatar} />}
            </Head>
            <View style={styles.container}>
                 <TopAppBar 
                    title={`@${profile.handle}`}
                    leading={<Pressable onPress={() => router.back()} style={styles.headerButton}><ArrowLeft size={24} color={theme.colors.onSurface} /></Pressable>}
                    actions={!isMe && session && (
                        <Pressable onPress={() => setIsActionsModalVisible(true)} style={styles.headerButton}>
                            <MoreHorizontal size={24} color={theme.colors.onSurface} />
                        </Pressable>
                    )}
                />
                <Feed
                    key={activeFilter}
                    feedUri={actor}
                    layout="grid"
                    authorFeedFilter={
                        activeFilter === 'posts'
                            ? 'posts_with_media'
                            : 'posts_with_replies'
                    }
                    postFilter={
                        activeFilter === 'reposts'
                            ? 'reposts_only'
                            : undefined
                    }
                    ListHeaderComponent={ListHeader}
                />
                 <Modal visible={isActionsModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsActionsModalVisible(false)}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setIsActionsModalVisible(false)}>
                        <Pressable style={styles.bottomSheet}>
                            <View style={styles.bottomSheetHeader}><Text style={styles.bottomSheetTitle}>{`@${profile.handle}`}</Text><Pressable onPress={() => setIsActionsModalVisible(false)} style={styles.closeButton}><X color={theme.colors.onSurfaceVariant}/></Pressable></View>
                            <Pressable onPress={handleMuteToggle} style={styles.actionItem}><MicOff color={theme.colors.onSurfaceVariant} /><Text style={styles.actionItemText}>{t(profile.viewer?.muted ? 'mediaActions.unmuteUser' : 'mediaActions.muteUser', { handle: '' })}</Text></Pressable>
                            <Pressable onPress={handleBlockToggle} style={styles.actionItem}><Shield color={theme.colors.error} /><Text style={[styles.actionItemText, styles.destructiveText]}>{t(profile.viewer?.blocking ? 'mediaActions.unblockUser' : 'mediaActions.blockUser', { handle: '' })}</Text></Pressable>
                            <Pressable onPress={() => Linking.openURL(`mailto:moderation@blueskyweb.xyz`)} style={styles.actionItem}><AlertTriangle color={theme.colors.error} /><Text style={[styles.actionItemText, styles.destructiveText]}>Report Account</Text></Pressable>
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background, padding: 16 },
    errorText: { color: theme.colors.error, ...theme.typography.bodyLarge },
    container: { flex: 1, backgroundColor: theme.colors.background },
    headerButton: { padding: theme.spacing.s, borderRadius: theme.shape.full },
    headerContainer: { backgroundColor: theme.colors.background, padding: theme.spacing.l, gap: theme.spacing.m },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.l },
    avatar: { width: 80, height: 80, borderRadius: theme.shape.full, backgroundColor: theme.colors.surfaceContainerHigh },
    stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { alignItems: 'center', gap: theme.spacing.xs },
    statNumber: { ...theme.typography.titleMedium, color: theme.colors.onSurface },
    statLabel: { ...theme.typography.bodyMedium, color: theme.colors.onSurfaceVariant },
    detailsContainer: { gap: theme.spacing.s },
    nameContainer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
    displayName: { ...theme.typography.titleLarge, color: theme.colors.onSurface },
    description: { ...theme.typography.bodyMedium, color: theme.colors.onSurface, lineHeight: 20 },
    actionButtonContainer: { marginTop: theme.spacing.m },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.s, paddingVertical: theme.spacing.m, borderRadius: theme.shape.medium, width: '100%' },
    editButton: { backgroundColor: theme.colors.surfaceContainerHigh },
    followingButton: { backgroundColor: theme.colors.surfaceContainerHigh },
    followButton: { backgroundColor: theme.colors.primary },
    actionButtonText: { ...theme.typography.labelLarge, color: theme.colors.onSurface, fontWeight: 'bold' },
    followButtonText: { color: theme.colors.onPrimary },
    unblockButton: { backgroundColor: theme.colors.surfaceContainerHigh, marginTop: theme.spacing.l },
    blockedTitle: { ...theme.typography.titleLarge, marginTop: theme.spacing.l, color: theme.colors.onSurface, textAlign: 'center' },
    blockedDescription: { ...theme.typography.bodyMedium, color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.s, textAlign: 'center' },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: theme.colors.surfaceContainer, borderTopLeftRadius: theme.shape.extraLarge, borderTopRightRadius: theme.shape.extraLarge, padding: theme.spacing.l, paddingTop: theme.spacing.s, gap: theme.spacing.s },
    bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.m },
    bottomSheetTitle: { ...theme.typography.titleMedium, color: theme.colors.onSurface },
    closeButton: { padding: theme.spacing.s, margin: -theme.spacing.s },
    actionItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.l, padding: theme.spacing.m, borderRadius: theme.shape.medium },
    actionItemText: { ...theme.typography.bodyLarge, color: theme.colors.onSurface },
    destructiveText: { color: theme.colors.error },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
        marginTop: theme.spacing.l,
    },
    filterButton: {
        paddingVertical: theme.spacing.m,
        alignItems: 'center',
        flex: 1,
    },
    activeIndicator: {
        height: 2,
        backgroundColor: theme.colors.primary,
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
    },
});

export default ProfileScreen;