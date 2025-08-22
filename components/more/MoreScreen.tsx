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
import { theme } from '@/lib/theme';


const ListItem: React.FC<{
    icon: React.ElementType,
    label: string,
    href: string,
}> = ({ icon: Icon, label, href }) => {
    const content = (
        <View style={styles.listItemContent}>
            <View style={styles.listItemLeft}>
                <Icon size={24} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.listItemLabel}>{label}</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.onSurfaceVariant} />
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
        { icon: List, label: t('more.myFeeds'), href: '/feeds' },
        { icon: Clapperboard, label: t('more.watch'), href: '/watch' },
        { icon: Search, label: t('nav.search'), href: '/search' },
        { icon: Bell, label: t('nav.notifications'), href: '/notifications' },
        { icon: Users, label: t('common.followers'), href: `/profile/${session.handle}/followers` },
        { icon: UserCheck, label: t('common.following'), href: `/profile/${session.handle}/following` },
        { icon: Settings, label: t('nav.settings'), href: '/settings' },
    ] : [];
    

    return (
        <>
            <Head><title>{t('more.title')}</title></Head>
            <View style={styles.container}>
                <View style={{gap: theme.spacing.xxl}}>
                    {isLoading ? (
                        <View style={[styles.profileCard, styles.profileCardSkeleton]}>
                            <View style={styles.profileContent}>
                                <View style={styles.avatarSkeleton} />
                                <View style={{gap: theme.spacing.s}}>
                                    <View style={styles.textSkeletonLg} />
                                    <View style={styles.textSkeletonSm} />
                                </View>
                            </View>
                        </View>
                    ) : profile && (
                        <Link href={profileLink as any} asChild>
                            <Pressable style={({ pressed }) => [styles.profileCard, pressed && styles.profileCardPressed]}>
                                <View style={styles.profileContent}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.l, flex: 1}}>
                                        <Image source={{ uri: profile.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/') }} style={styles.avatar} />
                                        <View style={{flex: 1}}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                                <Text style={styles.profileName} numberOfLines={1}>{profile.displayName || `@${profile.handle}`}</Text>
                                                {profile.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                                                    <BadgeCheck size={20} color={theme.colors.primary} fill="currentColor" />
                                                )}
                                            </View>
                                            <Text style={styles.profileHandle} numberOfLines={1}>@{profile.handle}</Text>
                                        </View>
                                    </View>
                                    <ChevronRight size={24} color={theme.colors.onSurfaceVariant} />
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
        paddingTop: theme.spacing.l,
        paddingHorizontal: theme.spacing.l,
    },
    profileCard: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.medium,
    },
    profileCardPressed: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    profileCardSkeleton: {
        height: 96,
        padding: theme.spacing.l,
        justifyContent: 'center'
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.l,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: theme.shape.full,
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    avatarSkeleton: {
        width: 64,
        height: 64,
        borderRadius: theme.shape.full,
        backgroundColor: theme.colors.surfaceContainerHigh,
        marginRight: theme.spacing.l,
    },
    textSkeletonLg: {
        height: 20,
        width: 128,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.small,
    },
    textSkeletonSm: {
        height: 16,
        width: 96,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.shape.small,
    },
    profileName: {
        ...theme.typography.titleMedium,
        color: theme.colors.onSurface
    },
    profileHandle: {
        ...theme.typography.bodyLarge,
        color: theme.colors.onSurfaceVariant,
    },
    sectionTitle: {
        ...theme.typography.labelLarge,
        color: theme.colors.onSurfaceVariant,
        marginBottom: theme.spacing.s,
        paddingHorizontal: theme.spacing.xs,
    },
    listContainer: {
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.large,
        overflow: 'hidden',
    },
    listItem: {
        padding: theme.spacing.l,
    },
    listItemPressed: {
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    listItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    listItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.l,
    },
    listItemLabel: {
        color: theme.colors.onSurface,
        ...theme.typography.bodyLarge,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.surfaceContainerHigh,
        marginLeft: 56,
    },
});

export default MoreScreen;