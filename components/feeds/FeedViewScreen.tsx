
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import Timeline from '../shared/Timeline';
import FeedViewHeader from './FeedViewHeader';
import Head from '../shared/Head';
import { useFeedActions } from '../../hooks/useFeedActions';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

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
                <ActivityIndicator size="large" color="#A8C7FA" />
            </View>
        );
    }

    if (error || !feedUri) {
         return (
             <>
                <FeedViewHeader feedUri="" onBack={() => router.back()} />
                <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>
             </>
        );
    }

    return (
        <>
            <Head>
                <title>{feedView ? `${t('common.feeds')}: ${feedView.displayName}` : t('common.feeds')}</title>
                {feedView?.description && <meta name="description" content={feedView.description} />}
                {feedView?.avatar && <meta property="og:image" content={feedView.avatar} />}
            </Head>
            <View style={{flex: 1}}>
                <FeedViewHeader
                    feedUri={feedUri}
                    onBack={() => router.back()}
                />
                <View style={styles.timelineContainer}>
                    <Timeline key={feedUri} feedUri={feedUri} />
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
    errorText: {
        fontSize: 16,
        color: '#F2B8B5',
    },
    timelineContainer: {
        marginTop: 16,
        paddingHorizontal: 16,
    }
});

export default FeedViewScreen;
