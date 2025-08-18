
import React, { useRef, useEffect, useState } from 'react';
import { useAtp } from '../../context/AtpContext';
import {AppBskyFeedDefs,AppBskyEmbedVideo,AppBskyEmbedRecordWithMedia,AppBskyActorDefs } from '@atproto/api';
import RichTextRenderer from '../shared/RichTextRenderer';
import VideoActions from './VideoActions';
import { Volume2, VolumeX, Play, Loader2 } from 'lucide-react';
import Hls from 'hls.js';

interface VideoPlayerProps {
    postView: AppBskyFeedDefs.FeedViewPost;
    isActive: boolean;
    shouldLoad: boolean;
    hlsUrl?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ postView, isActive, shouldLoad, hlsUrl }) => {
    const { agent } = useAtp();
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isThumbnailVisible, setIsThumbnailVisible] = useState(true);
    const [showPlayIcon, setShowPlayIcon] = useState(false);

    const { post } = postView;
    const record = post.record as any;

    let embedView: AppBskyEmbedVideo.View | undefined;
    if (AppBskyEmbedVideo.isView(post.embed)) {
        embedView = post.embed;
    } else if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) {
        embedView = post.embed.media as AppBskyEmbedVideo.View;
    }

    if (!embedView) return null;

    const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
    const videoCid = embedView.cid;
    if (!authorDid || !videoCid || !agent.service) return null;

    const serviceUrl = agent.service.toString();
    const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
    const blobVideoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const cleanup = () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            if (videoElement.src) {
                videoElement.removeAttribute('src');
                videoElement.load();
            }
            // Reset state when unloaded
            setIsReady(false);
            setIsBuffering(false);
            setIsPlaying(false);
            setIsThumbnailVisible(true);
        };

        const setupPlayer = () => {
            if (hlsUrl) {
                if (Hls.isSupported()) {
                    const hls = new Hls({
                        // More aggressive config
                        maxBufferLength: 30,
                        maxMaxBufferLength: 60,
                        startLevel: -1, // Auto-start with best quality
                    });
                    hlsRef.current = hls;
                    hls.loadSource(hlsUrl);
                    hls.attachMedia(videoElement);
                    hls.on(Hls.Events.ERROR, (event, data) => {
                        console.error('HLS Error:', data);
                        if (data.fatal) { // Fallback on fatal error
                            cleanup();
                            videoElement.src = blobVideoUrl;
                        }
                    });
                } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                    videoElement.src = hlsUrl;
                } else {
                    videoElement.src = blobVideoUrl;
                }
            } else {
                videoElement.src = blobVideoUrl; // Fallback if URL is missing
            }
        };

        if (shouldLoad) {
            setupPlayer();
        } else {
            cleanup();
        }

        return cleanup;
    }, [shouldLoad, hlsUrl, blobVideoUrl]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            if (isActive) {
                videoElement.play().then(() => setIsPlaying(true)).catch(e => {
                    // Autoplay might be blocked, user interaction will fix it.
                    setIsPlaying(false);
                });
            } else {
                videoElement.pause();
                videoElement.currentTime = 0;
                setIsPlaying(false);
            }
        }
    }, [isActive]);

    const handlePlaying = () => {
        setIsBuffering(false);
        if (!isReady) {
            setIsReady(true);
            // Wait for fade-in transition before hiding thumbnail
            setTimeout(() => setIsThumbnailVisible(false), 300);
        }
    };
    
    const handleVideoClick = () => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        if (videoElement.paused) {
            videoElement.play();
            setIsPlaying(true);
        } else {
            videoElement.pause();
            setIsPlaying(false);
            setShowPlayIcon(true);
            setTimeout(() => setShowPlayIcon(false), 800);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(prev => !prev);
    };

    return (
        <div className="relative w-full h-full bg-black snap-start" onClick={handleVideoClick}>
            {isThumbnailVisible && (
                <img 
                    src={embedView.thumbnail} 
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-contain z-0" 
                    aria-hidden="true"
                />
            )}
            <video
                ref={videoRef}
                loop
                playsInline
                muted={isMuted}
                className={`w-full h-full object-contain z-10 transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
                onPlaying={handlePlaying}
                onWaiting={() => setIsBuffering(true)}
            />

            {isBuffering && isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
            )}

            {showPlayIcon && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none z-20 animate-in fade-in-0 duration-200">
                    <Play size={80} className="text-white/80" fill="currentColor" />
                </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 bg-gradient-to-t from-black/60 to-transparent text-white pointer-events-none z-20">
                <a href={`#/profile/${post.author.handle}`} className="font-bold flex items-center gap-2 pointer-events-auto w-fit">
                    @{post.author.handle}
                </a>
                <p className="text-sm mt-1 line-clamp-2">
                    <RichTextRenderer record={record} />
                </p>
            </div>
            
            <VideoActions post={post} />
            
            <button onClick={toggleMute} className="absolute top-4 right-4 bg-black/40 p-2 rounded-full text-white hover:bg-black/60 transition-colors z-20">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </div>
    );
};

export default VideoPlayer;
