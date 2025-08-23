
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { useAtp } from '../../context/AtpContext';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { AppBskyActorDefs } from '@atproto/api';
import { 
    Settings, List, Search, 
    Bell, Users, UserCheck, Clapperboard, ChevronRight, Bookmark
} from 'lucide-react';
import Head from '../shared/Head';
import { View, Text, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import { theme } from '@/lib/theme';

// --- Reusable Icon Components for the new SuperApp Layout ---

const QuickActionItem: React.FC<{ icon: React.ElementType, label: string, href: string }> = ({ icon: Icon, label, href }) => (
    <Link href={href as any} asChild>
        <Pressable style={styles.quickActionItem}>
            <View style={styles.quickActionIconContainer}>
                <Icon size={28} color={theme.colors.onSurface} />
            </View>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </Pressable>
    </Link>
);

const AppGridItem: React.FC<{ icon: React.ElementType, label: string, href: string, color: string }> = ({ icon: Icon, label, href, color }) => (
    <Link href={href as any} asChild>
        <Pressable style={styles.appGridItem}>
            <View style={[styles.appGridIconContainer, { backgroundColor: color }]}>
                <Icon size={32} color="white" />
            </View>
            <Text style={styles.appGridItemLabel}>{label}</Text>
        </Pressable>
    </Link>
);


// --- Main MoreScreen Component ---

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

    const renderSkeleton = () => (
        <View style={styles.container}>
            <View style={styles.profileSection}>
                <View style={styles.avatarSkeleton} />
                <View style={{ flex: 1, gap: theme.spacing.s }}>
                    <View style={styles.textSkeletonLg} />
                    <View style={styles.textSkeletonSm} />
                </View>
            </View>
            <View style={styles.divider} />
        </View>
    );

    return (
        <>
            <Head><title>{t('more.title')}</title></Head>
            <ScrollView style={styles.scrollView}>
                <View style={styles.container}>
                    {isLoading ? renderSkeleton() : (
                        profile && (
                            <Link href={profileLink as any} asChild>
                                <Pressable style={({ pressed }) => [styles.profileSection, pressed && styles.pressed]}>
                                    <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                                    <View style={styles.profileTextContainer}>
                                        <Text style={styles.displayName}>{profile.displayName || `@${profile.handle}`}</Text>
                                        <Text style={styles.handle}>@{profile.handle}</Text>
                                    </View>
                                    <ChevronRight size={24} color={theme.colors.onSurfaceVariant} />
                                </Pressable>
                            </Link>
                        )
                    )}
                    
                    <View style={styles.divider} />

                    {session && (
                        <>
                            <View style={styles.quickActionsContainer}>
                                <QuickActionItem icon={Bell} label={t('nav.notifications')} href="/notifications" />
                                <QuickActionItem icon={List} label={t('more.myFeeds')} href="/feeds" />
                                <QuickActionItem icon={Settings} label={t('nav.settings')} href="/settings" />
                            </View>

                            <View style={styles.allAppsSection}>
                                <Text style={styles.sectionTitle}>{t('more.allApps')}</Text>
                                <View style={styles.appsGridContainer}>
                                    <AppGridItem icon={Search} label={t('nav.search')} href="/search" color="#424242" />
                                    <AppGridItem icon={Clapperboard} label={t('more.watch')} href="/watch" color="#005B96" />
                                    <AppGridItem icon={Bookmark} label={t('nav.bookmarks')} href="/bookmarks" color="#AD1457" />
                                    <AppGridItem icon={Users} label={t('common.followers')} href={`/profile/${session.handle}/followers`} color="#6A1B9A" />
                                    <AppGridItem icon={UserCheck} label={t('common.following')} href={`/profile/${session.handle}/following`} color="#2E7D32" />
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    container: {
        padding: theme.spacing.l,
    },
    pressed: {
        backgroundColor: theme.colors.surfaceContainerHover,
    },
    // --- Profile Section ---
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.m,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: theme.shape.full,
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    profileTextContainer: {
        flex: 1,
        marginHorizontal: theme.spacing.m,
    },
    displayName: {
        ...theme.typography.titleLarge,
        color: theme.colors.onSurface,
    },
    handle: {
        ...theme.typography.bodyLarge,
        color: theme.colors.onSurfaceVariant,
        marginTop: theme.spacing.xs,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.outline,
        marginVertical: theme.spacing.l,
    },
    // --- Skeleton Styles ---
    avatarSkeleton: {
        width: 64,
        height: 64,
        borderRadius: theme.shape.full,
        backgroundColor: theme.colors.surfaceContainer,
    },
    textSkeletonLg: {
        height: 24,
        width: '60%',
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.small,
    },
    textSkeletonSm: {
        height: 20,
        width: '40%',
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.shape.small,
    },
    // --- Quick Actions ---
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-start',
        paddingVertical: theme.spacing.m,
        marginBottom: theme.spacing.l,
    },
    quickActionItem: {
        alignItems: 'center',
        gap: theme.spacing.m,
        flex: 1,
    },
    quickActionIconContainer: {
        width: 72,
        height: 72,
        borderRadius: theme.shape.extraLarge,
        backgroundColor: theme.colors.surfaceContainer,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickActionLabel: {
        ...theme.typography.bodyMedium,
        color: theme.colors.onSurface,
        textAlign: 'center',
    },
    // --- All Apps Grid ---
    allAppsSection: {
        marginTop: theme.spacing.l,
    },
    sectionTitle: {
        ...theme.typography.titleMedium,
        color: theme.colors.onSurface,
        marginBottom: theme.spacing.l,
    },
    appsGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: -theme.spacing.s, // Negative margin to create space for items
    },
    appGridItem: {
        width: '25%', // 4 items per row
        alignItems: 'center',
        padding: theme.spacing.s,
        marginBottom: theme.spacing.m,
    },
    appGridIconContainer: {
        width: 64,
        height: 64,
        borderRadius: theme.shape.large,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    appGridItemLabel: {
        ...theme.typography.bodySmall,
        color: theme.colors.onSurface,
        textAlign: 'center',
    },
});

export default MoreScreen;
