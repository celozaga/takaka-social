
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Platform } from 'react-native';
import { Link } from 'expo-router';
import { AppBskyActorDefs, RichText, ComAtprotoLabelDefs } from '@atproto/api';
import Feed from '../shared/Feed';
import { BadgeCheck, Grid, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import RichTextRenderer from '../shared/RichTextRenderer';
import { useUI } from '../../context/UIContext';
import Head from '../shared/Head';
import Label from '../shared/Label';
import ProfileHeader from './ProfileHeader';

type FeedFilter = 'all' | 'photos' | 'videos';

const ProfileScreen: React.FC<{ actor: string }> = ({ actor }) => {
    const { agent, session } = useAtp();
    const { t } = useTranslation();
    const { toast } = useToast();
    const { openEditProfileModal, setCustomFeedHeaderVisible } = useUI();
    const { getProfile } = useProfileCache();

    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [viewerState, setViewerState] = useState<AppBskyActorDefs.ViewerState | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [descriptionWithFacets, setDescriptionWithFacets] = useState<{ text: string, facets: RichText['facets'] | undefined } | null>(null);
    const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
    
    const isMe = session?.did === profile?.did;

    useEffect(() => { setCustomFeedHeaderVisible(true); return () => setCustomFeedHeaderVisible(false); }, [setCustomFeedHeaderVisible]);

    const handleFollow = async () => { /* ... */ };
    const handleUnfollow = async () => { /* ... */ };

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const profileRes = await getProfile(actor);
                setProfile(profileRes);
                setViewerState(profileRes.viewer);
            } catch (err: any) {
                if (err.error === 'BlockedByActor') setError(t('profile.blockedBy'));
                else setError(err.message || t('profile.loadingError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [getProfile, actor, t]);
    
    useEffect(() => {
        if (profile?.description) {
            const rt = new RichText({ text: profile.description });
            rt.detectFacets(agent).then(() => setDescriptionWithFacets({ text: rt.text, facets: rt.facets }));
        } else {
            setDescriptionWithFacets(null);
        }
    }, [profile?.description, agent]);
    
    const ListHeader = useMemo(() => (
      <View>
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
        </View>
        <View style={styles.filterBar}>
            <Pressable onPress={() => setActiveFilter('all')} style={[styles.filterButton, activeFilter === 'all' && styles.activeFilter]}><Grid size={22} color={activeFilter === 'all' ? '#E2E2E6' : '#C3C6CF'} /></Pressable>
            <Pressable onPress={() => setActiveFilter('photos')} style={[styles.filterButton, activeFilter === 'photos' && styles.activeFilter]}><ImageIcon size={22} color={activeFilter === 'photos' ? '#E2E2E6' : '#C3C6CF'} /></Pressable>
            <Pressable onPress={() => setActiveFilter('videos')} style={[styles.filterButton, activeFilter === 'videos' && styles.activeFilter]}><VideoIcon size={22} color={activeFilter === 'videos' ? '#E2E2E6' : '#C3C6CF'} /></Pressable>
        </View>
      </View>
    ), [profile, actor, t, isMe, viewerState, isActionLoading, descriptionWithFacets, activeFilter, openEditProfileModal]);

    if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#A8C7FA" /></View>;
    if (error || !profile) return <View style={styles.centered}><Text style={styles.errorText}>{error || t('profile.notFound')}</Text></View>;
    
    return (
        <>
            <Head><title>{profile.displayName || profile.handle}</title></Head>
            <View style={{flex: 1}}>
                <ProfileHeader handle={profile.handle} onMoreClick={() => setIsMenuOpen(true)} />
                <View style={{ flex: 1 }}>
                    <Feed
                        // Using a key ensures the feed re-fetches when the actor or filter changes
                        key={`${actor}-${activeFilter}`}
                        feedUri={actor} 
                        mediaFilter={activeFilter}
                        ListHeaderComponent={ListHeader} 
                    />
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111314' },
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
    filterBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2b2d2e', backgroundColor: '#111314' },
    filterButton: { flex: 1, padding: 12, alignItems: 'center' },
    activeFilter: { borderBottomWidth: 2, borderBottomColor: '#A8C7FA' },
});

export default ProfileScreen;
