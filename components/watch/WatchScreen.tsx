
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import VideoPlayer from './VideoPlayer';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperCore } from 'swiper';

const DISCOVER_FEED_URI = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';

const WatchScreen: React.FC = () => {
    const { agent } = useAtp();
    const { t } = useTranslation();
    const [videoPosts, setVideoPosts] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
    const [playbackUrls, setPlaybackUrls] = useState<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const isPostVideo = (post: AppBskyFeedDefs.PostView): boolean => {
        return !!post.embed && (
            AppBskyEmbedVideo.isView(post.embed) ||
            (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media))
        );
    };

    const fetchVideos = useCallback(async (currentCursor?: string) => {
        if (isLoadingMore) return;
        if (!currentCursor) setIsLoading(true); else setIsLoadingMore(true);
        
        try {
            let fetchedPosts: AppBskyFeedDefs.FeedViewPost[] = [];
            let nextCursor = currentCursor;
            let attempts = 0;

            // Fetch until we have at least 5 videos or run out of posts/attempts
            while (fetchedPosts.filter(p => isPostVideo(p.post)).length < 5 && attempts < 5 && (hasMore || !currentCursor)) {
                if(!hasMore && currentCursor) break;
                attempts++;
                const response = await agent.app.bsky.feed.getFeed({ feed: DISCOVER_FEED_URI, cursor: nextCursor, limit: 50 });
                fetchedPosts.push(...response.data.feed);
                nextCursor = response.data.cursor;
                if (!nextCursor) {
                    setHasMore(false);
                    break;
                }
            }

            const newVideoPosts = fetchedPosts.filter(p => isPostVideo(p.post));

            setVideoPosts(prev => {
                const existingUris = new Set(prev.map(p => p.post.uri));
                const uniqueNewPosts = newVideoPosts.filter(p => !existingUris.has(p.post.uri));
                return [...prev, ...uniqueNewPosts];
            });
            setCursor(nextCursor);

        } catch (err: any) {
            console.error('Failed to fetch video feed:', err);
            setError(t('timeline.loadingError'));
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [agent, hasMore, isLoadingMore, t]);

    const fetchPlaybackUrls = useCallback(async (posts: AppBskyFeedDefs.FeedViewPost[]) => {
        const postsWithoutUrls = posts.filter(p => !playbackUrls.has(p.post.uri));
        if (postsWithoutUrls.length === 0) return;

        const urls = await Promise.all(postsWithoutUrls.map(async (p) => {
            try {
                const embed = p.post.embed;
                let videoEmbed: AppBskyEmbedVideo.View | undefined;
                if (AppBskyEmbedVideo.isView(embed)) {
                    videoEmbed = embed;
                } else if (AppBskyEmbedRecordWithMedia.isView(embed) && AppBskyEmbedVideo.isView(embed.media)) {
                    videoEmbed = embed.media as AppBskyEmbedVideo.View;
                }
                
                if (!videoEmbed) return null;

                const result = await (agent.api.app.bsky.video as any).getPlaybackUrl({
                    did: p.post.author.did,
                    cid: videoEmbed.cid,
                });
                return { uri: p.post.uri, url: result.data.url };
            } catch (error) {
                console.warn(`Could not get playback URL for ${p.post.uri}`, error);
                return null;
            }
        }));

        setPlaybackUrls(prev => {
            const newMap = new Map(prev);
            for (const item of urls) {
                if (item) {
                    newMap.set(item.uri, item.url);
                }
            }
            return newMap;
        });
    }, [agent, playbackUrls]);

    useEffect(() => {
        // Initial fetch
        fetchVideos();
    }, [fetchVideos]);

     useEffect(() => {
        if (videoPosts.length > 0) {
            fetchPlaybackUrls(videoPosts);
        }
    }, [videoPosts, fetchPlaybackUrls]);
    
    const handleSlideChange = (swiper: SwiperCore) => {
        setActiveIndex(swiper.activeIndex);
    };
    
    const handleReachEnd = () => {
        if (!isLoadingMore && hasMore) {
            fetchVideos(cursor);
        }
    };

    if (isLoading && videoPosts.length === 0) {
        return <div className="w-full h-full flex items-center justify-center bg-black"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <div className="w-full h-full flex items-center justify-center text-error p-4 bg-black">{error}</div>;
    }

    return (
        <div className="w-full h-full relative">
            <Swiper
                direction={'vertical'}
                slidesPerView={1}
                mousewheel={true}
                modules={[Mousewheel]}
                className="h-full"
                onSlideChange={handleSlideChange}
                onReachEnd={handleReachEnd}
            >
                {videoPosts.map((postView, index) => {
                    const shouldLoad = Math.abs(index - activeIndex) <= 2; // Preload next 2 and previous 2
                    return (
                        <SwiperSlide key={`${postView.post.uri}-${index}`}>
                            <VideoPlayer 
                                postView={postView} 
                                isActive={index === activeIndex} 
                                shouldLoad={shouldLoad}
                                hlsUrl={playbackUrls.get(postView.post.uri)}
                            />
                        </SwiperSlide>
                    );
                })}
                 {(isLoadingMore || (isLoading && videoPosts.length > 0)) && (
                    <SwiperSlide>
                        <div className="w-full h-full flex items-center justify-center bg-black">
                            <Loader2 className="w-8 h-8 animate-spin text-white" />
                        </div>
                    </SwiperSlide>
                 )}
                 {!hasMore && videoPosts.length > 0 && !isLoadingMore && (
                    <SwiperSlide>
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
                            <p className="text-lg font-semibold">{t('watch.allSeenTitle')}</p>
                            <p className="text-sm text-on-surface-variant mt-1">{t('watch.allSeenDescription')}</p>
                        </div>
                    </SwiperSlide>
                 )}
            </Swiper>

            <button onClick={() => window.history.back()} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors">
                <ArrowLeft size={24} />
            </button>
        </div>
    );
};

export default WatchScreen;
