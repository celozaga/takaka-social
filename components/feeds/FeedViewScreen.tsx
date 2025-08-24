import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import Feed from '../shared/Feed';
import FeedViewHeader from './FeedViewHeader';
import Head from 'expo-router/head';
import { useFeedActions } from '../../hooks/useFeedActions';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/lib/theme';
import ErrorState from '../shared/ErrorState';
import { ListX } from 'lucide-react';
import ScreenHeader from '../layout/ScreenHeader';

interface FeedViewScreenProps {
    handle: string;
    rkey: string;
}

const FeedViewScreen: React.FC<FeedViewScreenProps> = ({ handle, rkey }) => {
    const { agent } = useAtp();
    const { t } = useTranslation();
    const { setCustomFeedHeaderVisible } = useUI();
    const [feedUri, setFeedUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const { feedView } = useFeedActions(feedUri || undefined);

    useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    useEffect(() => {
        const resolveHandleAndSetUri = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data } = await agent.resolveHandle({ handle });
                const uri = `at://${data.did}/app.bsky.feed.generator/${rkey}`;
                setFeedUri(uri);
            } catch (err) {
                console.error("Failed to resolve handle to create feed URI:", err);
                setError(t('feedView.notFound'));
            } finally {
                setIsLoading(false);
            }
        };
        resolveHandleAndSetUri();
    }, [agent, handle, rkey, t]);
    
    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (error || !feedUri) {
         return (
             <View style={{flex: 1}}>
                <ScreenHeader title={t('common.feeds')} />
                <View style={{ flex: 1 }}>
                    <ErrorState
                        icon={ListX}
                        title={t('errors.feedNotFound.title')}
                        message={t('errors.feedNotFound.message')}
                    />
                </View>
             </View>
        );
    }

    const feedUrl = `https://bsky.app/profile/${handle}/feed/${rkey}`;
    const truncatedDescription = feedView?.description ? (feedView.description.length > 155 ? feedView.description.substring(0, 155) + '...' : feedView.description) : `View the '${feedView?.displayName}' feed on Takaka.`;

    return (
        <>
            <Head>
                <title>{feedView ? `${feedView.displayName} Feed | Takaka` : t('common.feeds')}</title>
                <meta name="description" content={truncatedDescription} />
                 {/* Open Graph Tags */}
                <meta property="og:title" content={feedView ? `${feedView.displayName} Feed` : 'Bluesky Feed'} />
                <meta property="og:description" content={truncatedDescription} />
                <meta property="og:url" content={feedUrl} />
                <meta property="og:type" content="website" />
                {feedView?.avatar && <meta property="og:image" content={feedView.avatar} />}
            </Head>
            <View style={{flex: 1}}>
                <FeedViewHeader
                    feedUri={feedUri}
                    onBack={() => router.back()}
                />
                <View style={styles.feedContainer}>
                    <Feed key={feedUri} feedUri={feedUri} />
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    feedContainer: {
        flex: 1,
    }
});

export default FeedViewScreen;