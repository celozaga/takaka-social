
import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Head } from 'expo-router/head';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Feed from '@/components/shared/Feed';
import { useAtp } from '@/context/AtpContext';
import { Search } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useDebounce } from '@/hooks/useDebounce';

export default function BookmarksScreen() {
    const { t } = useTranslation();
    const { session } = useAtp();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    return (
        <>
            <Head><title>{t('nav.bookmarks')}</title></Head>
            <View style={{flex: 1}}>
                <ScreenHeader title={t('nav.bookmarks')} />
                <View style={styles.searchContainer}>
                    <View style={styles.inputContainer}>
                        <Search style={styles.searchIcon} color={theme.colors.onSurfaceVariant} size={20} />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder={t('search.placeholderSaved')}
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                            style={styles.input}
                        />
                    </View>
                </View>

                {session && (
                    <Feed
                        key="bookmarks"
                        feedUri={session.did} // Pass DID for context
                        postFilter="bookmarks_only"
                        layout="grid"
                        searchQuery={debouncedSearchQuery}
                    />
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
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
        borderRadius: theme.shape.medium,
        color: theme.colors.onSurface,
        fontSize: 16,
    },
});