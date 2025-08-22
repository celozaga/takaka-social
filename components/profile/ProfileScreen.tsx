import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Modal, Linking, Alert, Platform } from 'react-native';
import { Link } from 'expo-router';
import { AppBskyActorDefs, RichText, AtUri } from '@atproto/api';
import Feed from '../shared/Feed';
import { BadgeCheck, MoreHorizontal, UserX, Shield, AlertTriangle, MicOff, Edit, X } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useUI } from '../../context/UIContext';
import Head from '../shared/Head';
import ScreenHeader from '../layout/ScreenHeader';
import { theme } from '@/lib/theme';

const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { t } = useTranslation();
    const { toast } = useToast();
    const { getProfile, clearProfile } = useProfileCache();
    const { openEditProfileModal } = useUI();

    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [descriptionWithFacets, setDescriptionWithFacets] = useState<{ text: string, facets: RichText['facets'] | undefined } | null>(null);
    
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);

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
            {profile?.banner ? <Image source={{ uri: profile.banner }} style={styles.banner} /> : <View style={styles.banner} />}
            <View style={styles.profileInfoContainer}>
                <View style={styles.avatarActionRow}>
                    <Image source={{ uri: profile?.avatar }} style={styles.avatar} />
                    {isMe ? (
                        <Pressable onPress={openEditProfileModal} style={[styles.actionButton, styles.editButton]}>
                            <Text style={styles.actionButtonText}>{t('common.editProfile')}</Text>
                        </Pressable>
                    ) : session && (
                        <Pressable onPress={handleFollowToggle} disabled={isActionLoading} style={[styles.actionButton, profile?.viewer?.following ? styles.followingButton : styles.followButton]}>
                            {isActionLoading ? <ActivityIndicator color={profile?.viewer?.following ? theme.colors.onSurface : theme.colors.onPrimary} /> : <Text style={[styles.actionButtonText, !profile?.viewer?.following && styles.followButtonText]}>{t(profile?.viewer?.following ? 'common.following' : 'common.follow')}</Text>}
                        </Pressable>
                    )}
                </View>
                <View style={styles.detailsContainer}>
                    <View style={styles.nameContainer}>
                        <Text style={styles.displayName}>{profile?.displayName || `@${profile?.handle}`}</Text>
                        {profile?.labels?.some(l => l.val === 'blue-check') && <BadgeCheck size={20} color={theme.colors.onSurface} fill={theme.colors.onSurface} />}
                    </View>
                    <Text style={styles.handle}>@{profile?.handle}</Text>
                    {descriptionWithFacets && <Text style={styles.description}><RichTextRenderer record={descriptionWithFacets} /></Text>}
                    <View style={styles.statsContainer}>
                        <Link href={`/profile/${actor}/following`} asChild><Pressable><Text style={styles.statNumber}>{profile?.followsCount ?? 0} <Text style={styles.statLabel}>{t('common.following')}</Text></Text></Pressable></Link>
                        <Link href={`/profile/${actor}/followers`} asChild><Pressable><Text style={styles.statNumber}>{profile?.followersCount ?? 0} <Text style={styles.statLabel}>{t('common.followers')}</Text></Text></Pressable></Link>
                    </View>
                </View>
            </View>
        </View>
    );

    if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
    if (error) return <View><ScreenHeader title={t('profile.title')} /><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></View>;
    if (!profile) return <View><ScreenHeader title={t('profile.title')} /><View style={styles.centered}><Text style={styles.errorText}>{t('profile.notFound')}</Text></View></View>;
    
    if (profile.viewer?.blockedBy) return <><ScreenHeader title={profile.handle} /><View style={styles.centered}><Shield size={48} color={theme.colors.onSurfaceVariant} /><Text style={styles.blockedTitle}>{t('profile.blockedBy')}</Text></View></>;

    if (profile.viewer?.blocking) {
        return (
            <>
                <ScreenHeader title={profile.handle} />
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
            <Head><title>{profile.displayName || `@${profile.handle}`}</title>{profile.description && <meta name="description" content={profile.description} />}{profile.avatar && <meta property="og:image" content={profile.avatar} />}</Head>
            <View style={styles.container}>
                <ScreenHeader title={profile.displayName || `@${profile.handle}`}>
                    {!isMe && session && (
                        <Pressable onPress={() => setIsActionsModalVisible(true)} style={styles.headerButton}>
                            <MoreHorizontal size={24} color={theme.colors.onSurface} />
                        </Pressable>
                    )}
                </ScreenHeader>
                <Feed
                    feedUri={actor}
                    layout="grid"
                    authorFeedFilter="posts_with_media"
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
    headerContainer: { backgroundColor: theme.colors.background },
    banner: { width: '100%', height: 150, backgroundColor: theme.colors.surfaceContainerHigh },
    profileInfoContainer: { paddingHorizontal: theme.spacing.l, paddingBottom: theme.spacing.l },
    avatarActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -48, marginBottom: theme.spacing.m },
    avatar: { width: 96, height: 96, borderRadius: theme.shape.full, backgroundColor: theme.colors.surfaceContainerHigh, borderWidth: 4, borderColor: theme.colors.background },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.s, paddingVertical: theme.spacing.s, paddingHorizontal: theme.spacing.l, borderRadius: theme.shape.medium, minWidth: 120 },
    editButton: { backgroundColor: theme.colors.surfaceContainerHigh },
    followingButton: { backgroundColor: theme.colors.surfaceContainerHigh },
    followButton: { backgroundColor: theme.colors.primary },
    actionButtonText: { ...theme.typography.labelLarge, color: theme.colors.onSurface, fontWeight: 'bold' },
    followButtonText: { color: theme.colors.onPrimary },
    unblockButton: { backgroundColor: theme.colors.surfaceContainerHigh, marginTop: theme.spacing.l },
    detailsContainer: { gap: theme.spacing.s },
    nameContainer: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
    displayName: { ...theme.typography.titleLarge, color: theme.colors.onSurface },
    handle: { ...theme.typography.bodyLarge, color: theme.colors.onSurfaceVariant },
    description: { ...theme.typography.bodyMedium, color: theme.colors.onSurface, lineHeight: 20 },
    statsContainer: { flexDirection: 'row', gap: theme.spacing.l, marginTop: theme.spacing.xs },
    statNumber: { ...theme.typography.bodyMedium, color: theme.colors.onSurface, fontWeight: 'bold' },
    statLabel: { color: theme.colors.onSurfaceVariant, fontWeight: 'normal' },
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
});

export default ProfileScreen;