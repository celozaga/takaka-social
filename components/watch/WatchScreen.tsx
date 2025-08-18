
import React, { useState, useEffect, useCallback } from 'react';
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
    const [videoPosts, setVideoPosts] = useState<AppBskyFeedDefs.FeedViewPost[]>([]);
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
            setError('Could not load videos.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [agent, hasMore, isLoadingMore]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);
    
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
                {videoPosts.map((postView, index) => (
                    <SwiperSlide key={`${postView.post.uri}-${index}`}>
                        <VideoPlayer postView={postView} isActive={index === activeIndex} />
                    </SwiperSlide>
                ))}
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
                            <p className="text-lg font-semibold">You've seen it all!</p>
                            <p className="text-sm text-on-surface-variant mt-1">Check back later for more videos.</p>
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
