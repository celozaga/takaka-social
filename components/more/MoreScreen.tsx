
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { useAtp } from '../../context/AtpContext';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { AppBskyActorDefs } from '@atproto/api';
import { 
    Settings, ChevronRight, BadgeCheck, List, Search, 
    Bell, Users, UserCheck, Clapperboard
} from 'lucide-react';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';


const ListItem: React.FC<{
    icon: React.ElementType,
    label: string,
    href: string,
}> = ({ icon: Icon, label, href }) => {
    const content = (
        <View style={styles.listItemContent}>
            <View style={styles.listItemLeft}>
                <Icon size={24} color="#C3C6CF" />
                <Text style={styles.listItemLabel}>{label}</Text>
            </View>
            <ChevronRight size={20} color="#C3C6CF" />
        </View>
    );
    
    return (
        <Link href={href as any} asChild>
            <Pressable style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}>
                {content}
            </Pressable>
        </Link>
    );
};


const MoreScreen: React.FC = () => {
    const { session } = useAtp();
    const { getProfile } = useProfileCache();
    const { t } = useTranslation();
    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (session?.did) {
            setIsLoading(true);
            getProfile(session.did)
                .then(setProfile)
                .catch(err => console.error("Failed to fetch profile for More screen:", err))
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
            setProfile(null);
        }
    }, [getProfile, session?.did]);
    
    const profileLink = session?.handle ? `/profile/${session.handle}` : '/';

    const listItems = session ? [
        { icon: List, label: t('more.myFeeds'), href: '/(tabs)/feeds' },
        { icon: Clapperboard, label: t('more.watch'), href: '/(tabs)/watch' },
        { icon: Search, label: t('nav.search'), href: '/(tabs)/search' },
        { icon: Bell, label: t('nav.notifications'), href: '/(tabs)/notifications' },
        { icon: Users, label: t('common.followers'), href: `/profile/${session.handle}/followers` },
        { icon: UserCheck, label: t('common.following'), href: `/profile/${session.handle}/following` },
        { icon: Settings, label: t('nav.settings'), href: '/(tabs)/settings' },
    ] : [];
    

    return (
        <>
            <Head><title>{t('more.title')}</title></Head>
            <View style={styles.container}>
                <View style={{gap: 32}}>
                    {isLoading ? (
                        <View style={[styles.profileCard, styles.profileCardSkeleton]}>
                            <View style={styles.profileContent}>
                                <View style={styles.avatarSkeleton} />
                                <View style={{gap: 8}}>
                                    <View style={styles.textSkeletonLg} />
                                    <View style={styles.textSkeletonSm} />
                                </View>
                            </View>
                        </View>
                    ) : profile && (
                        <Link href={profileLink as any} asChild>
                            <Pressable style={({ pressed }) => [styles.profileCard, pressed && styles.profileCardPressed]}>
                                <View style={styles.profileContent}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1}}>
                                        <Image source={{ uri: profile.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                                        <View style={{flex: 1}}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                                <Text style={styles.profileName} numberOfLines={1}>{profile.displayName || `@${profile.handle}`}</Text>
                                                {profile.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                                                    <BadgeCheck size={20} color="#A8C7FA" fill="currentColor" />
                                                )}
                                            </View>
                                            <Text style={styles.profileHandle} numberOfLines={1}>@{profile.handle}</Text>
                                        </View>
                                    </View>
                                    <ChevronRight size={24} color="#C3C6CF" />
                                </View>
                            </Pressable>
                        </Link>
                    )}

                    {session && (
                        <View>
                            <Text style={styles.sectionTitle}>{t('more.allApps')}</Text>
                            <View style={styles.listContainer}>
                                {listItems.map((item, index) => (
                                    <React.Fragment key={item.label}>
                                        <ListItem {...item} />
                                        {index < listItems.length - 1 && <View style={styles.divider} />}
                                    </React.Fragment>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 16,
        paddingHorizontal: 16,
    },
    profileCard: {
        backgroundColor: '#1E2021', // surface-2
        borderRadius: 8,
    },
    profileCardPressed: {
        backgroundColor: '#2b2d2e', // surface-3
    },
    profileCardSkeleton: {
        height: 96,
        padding: 16,
        justifyContent: 'center'
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2b2d2e',
    },
    avatarSkeleton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2b2d2e',
        marginRight: 16,
    },
    textSkeletonLg: {
        height: 20,
        width: 128,
        backgroundColor: '#2b2d2e',
        borderRadius: 4,
    },
    textSkeletonSm: {
        height: 16,
        width: 96,
        backgroundColor: '#2b2d2e',
        borderRadius: 4,
    },
    profileName: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#E2E2E6' // on-surface
    },
    profileHandle: {
        color: '#C3C6CF', // on-surface-variant
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#C3C6CF',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    listContainer: {
        backgroundColor: '#1E2021',
        borderRadius: 12,
        overflow: 'hidden',
    },
    listItem: {
        padding: 16,
    },
    listItemPressed: {
        backgroundColor: '#2b2d2e',
    },
    listItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    listItemLabel: {
        color: '#E2E2E6',
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#2b2d2e', // surface-3
        marginLeft: 56, // to align with text
    },
});

export default MoreScreen;
