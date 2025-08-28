

import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Head from 'expo-router/head';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Feed from '@/components/shared/Feed';
import { useAtp } from '@/context/AtpContext';
import { Search } from 'lucide-react';
import { useTheme } from '@/components/shared';
import { useDebounce } from '@/hooks/useDebounce';
import RouteGuard from '@/components/auth/RouteGuard';

export default function LikesScreen() {
    const { theme } = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
    const { t } = useTranslation();
    const { session } = useAtp();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    return (
        <>
            <Head><title>{t('nav.likes')}</title></Head>
            <View style={{flex: 1}}>
                <ScreenHeader title={t('nav.likes')} />
                <View style={styles.searchContainer}>
                    <View style={styles.inputContainer}>
                        <Search style={styles.searchIcon} color={theme.colors.onSurfaceVariant} size={20} />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder={t('search.placeholderLiked')}
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                            style={styles.input}
                        />
                    </View>
                </View>

                {session && (
                    <Feed
                        key="likes"
                        feedUri={session.did} // Pass DID for context
                        postFilter="likes_only"
                        layout="grid"
                        searchQuery={debouncedSearchQuery}
                    />
                )}
            </View>
        </>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    searchContainer: {
        paddingHorizontal: theme.spacing.l,
        paddingBottom: theme.spacing.l,
        backgroundColor: theme.colors.background,
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    searchIcon: {
        position: 'absolute',
        left: theme.spacing.l,
        zIndex: 1,
    },
    input: {
        width: '100%',
        paddingLeft: 48,
        paddingRight: theme.spacing.l,
        paddingVertical: theme.spacing.m,
        backgroundColor: theme.colors.surfaceContainer,
        borderRadius: theme.radius.md,
        color: theme.colors.onSurface,
        fontSize: 16,
    },
});