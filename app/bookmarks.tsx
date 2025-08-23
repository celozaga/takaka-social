
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Head from '@/components/shared/Head';
import ScreenHeader from '@/components/layout/ScreenHeader';
import Feed from '@/components/shared/Feed';
import { useAtp } from '@/context/AtpContext';

export default function BookmarksScreen() {
    const { t } = useTranslation();
    const { session } = useAtp();

    return (
        <>
            <Head><title>{t('nav.bookmarks')}</title></Head>
            <View style={{flex: 1}}>
                <ScreenHeader title={t('nav.bookmarks')} />
                {session && (
                    <Feed
                        key="bookmarks"
                        feedUri={session.did} // Pass DID for context
                        postFilter="bookmarks_only"
                        layout="grid"
                    />
                )}
            </View>
        </>
    );
}
