

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import Timeline from '../shared/Timeline';
import FeedViewHeader from './FeedViewHeader';
import { ArrowLeft } from 'lucide-react';
import { useHeadManager } from '../../hooks/useHeadManager';
import { useFeedActions } from '../../hooks/useFeedActions';

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

    const { feedView } = useFeedActions(feedUri || undefined);

    useHeadManager({
        title: feedView ? `${t('common.feeds')}: ${feedView.displayName}` : t('common.feeds'),
        description: feedView?.description,
        imageUrl: feedView?.avatar,
    });

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
             <div className="sticky top-0 -mx-4 px-4 bg-surface-1/80 backdrop-blur-sm z-30 animate-pulse">
                <div className="flex items-center justify-between h-16">
                    <div className="h-8 w-10 bg-surface-3 rounded-full"></div>
                    <div className="h-8 w-48 bg-surface-3 rounded-md"></div>
                    <div className="h-8 w-16 bg-surface-3 rounded-full"></div>
                </div>
            </div>
        );
    }

    if (error || !feedUri) {
         return (
             <div className="sticky top-0 -mx-4 px-4 bg-surface-1/80 backdrop-blur-sm z-30">
                <div className="flex items-center justify-between h-16">
                     <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-surface-3">
                        <ArrowLeft size={20} />
                    </button>
                    <p className="text-sm text-error">{error}</p>
                    <div className="w-8"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <FeedViewHeader
                feedUri={feedUri}
                onBack={() => window.history.back()}
            />
            <div className="mt-4">
                <Timeline key={feedUri} feedUri={feedUri} />
            </div>
        </div>
    );
};

export default FeedViewScreen;