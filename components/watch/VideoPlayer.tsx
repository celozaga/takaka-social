
import React, { useRef, useEffect, useState } from 'react';
import { useAtp } from '../../context/AtpContext';
import { AppBskyFeedDefs, AppBskyEmbedVideo, AppBskyEmbedRecordWithMedia, AppBskyActorDefs } from '@atproto/api';
import RichTextRenderer from '../shared/RichTextRenderer';
import VideoActions from './VideoActions';
import { Volume2, VolumeX, Play } from 'lucide-react';

interface VideoPlayerProps {
    postView: AppBskyFeedDefs.FeedViewPost;
    isActive: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ postView, isActive }) => {
    const { agent } = useAtp();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPlayIcon, setShowPlayIcon] = useState(false);

    const { post } = postView;
    const record = post.record as any;

    useEffect(() => {
        if (isActive) {
            videoRef.current?.play().then(() => setIsPlaying(true)).catch(e => {
                 // Autoplay was likely blocked, we can ignore this error.
                 // The user can manually play by tapping.
                setIsPlaying(false);
            });
        } else {
            videoRef.current?.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    const handleVideoClick = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
                setShowPlayIcon(true);
                setTimeout(() => setShowPlayIcon(false), 800);
            }
        }
    };
    
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(prev => !prev);
    };

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
    const videoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
    
    return (
        <div className="relative w-full h-full bg-black snap-start" onClick={handleVideoClick}>
            <video
                ref={videoRef}
                src={videoUrl}
                poster={embedView.thumbnail}
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain"
            />
            
            {showPlayIcon && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none animate-in fade-in-0 duration-200">
                    <Play size={80} className="text-white/80" fill="currentColor" />
                </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 bg-gradient-to-t from-black/60 to-transparent text-white pointer-events-none">
                <a href={`#/profile/${post.author.handle}`} className="font-bold flex items-center gap-2 pointer-events-auto w-fit">
                    @{post.author.handle}
                </a>
                <p className="text-sm mt-1 line-clamp-2">
                    <RichTextRenderer record={record} />
                </p>
            </div>
            
            <VideoActions post={post} />
            
            <button onClick={toggleMute} className="absolute top-4 right-4 bg-black/40 p-2 rounded-full text-white hover:bg-black/60 transition-colors">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </div>
    );
};

export default VideoPlayer;
