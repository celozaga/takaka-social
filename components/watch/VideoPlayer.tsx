import React, { useRef, useEffect, useState } from 'react';
import { useAtp } from '../../context/AtpContext';
import {AppBskyFeedDefs,AppBskyEmbedVideo,AppBskyEmbedRecordWithMedia,AppBskyActorDefs } from '@atproto/api';
import RichTextRenderer from '../shared/RichTextRenderer';
import VideoActions from './VideoActions';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import SharedVideoPlayer from '../shared/VideoPlayer';
import type Player from 'video.js/dist/types/player';


interface VideoPlayerProps {
    postView: AppBskyFeedDefs.FeedViewPost;
    isActive: boolean;
    shouldLoad: boolean;
    hlsUrl?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ postView, isActive, shouldLoad, hlsUrl }) => {
    const { agent } = useAtp();
    const playerRef = useRef<Player | null>(null);

    const [isMuted, setIsMuted] = useState(true);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

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

    const playerOptions = {
        autoplay: isActive,
        controls: false, // We use a custom UI
        poster: embedView.thumbnail,
        sources: [{
            src: hlsUrl || blobVideoUrl,
            type: hlsUrl ? 'application/x-mpegURL' : 'video/mp4'
        }],
        loop: true,
        muted: isMuted,
        playsinline: true,
    };
    
    useEffect(() => {
        const player = playerRef.current;
        if (player) {
            if (isActive) {
                player.play()?.catch(() => {});
            } else {
                player.pause();
                player.currentTime(0);
            }
        }
    }, [isActive]);

    const handlePlayerReady = (player: Player) => {
        playerRef.current = player;
        setIsPlayerReady(true);
        if (isActive) {
            player.play()?.catch(() => {});
        }
    };
    
    const handleVideoClick = () => {
        const player = playerRef.current;
        if (!player) return;

        if (player.paused()) {
            player.play()?.catch(() => {});
        } else {
            player.pause();
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(prev => !prev);
        if(playerRef.current) {
            playerRef.current.muted(!isMuted);
        }
    };

    if (!shouldLoad) {
        return <div className="w-full h-full bg-black" />;
    }

    return (
        <div className="relative w-full h-full bg-black snap-start" onClick={handleVideoClick}>
            <SharedVideoPlayer
                options={playerOptions}
                onReady={handlePlayerReady}
                className="w-full h-full"
            />

            {!isPlayerReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
                    <img src={embedView.thumbnail} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-contain z-0" aria-hidden="true" />
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 bg-gradient-to-t from-black/60 to-transparent text-white pointer-events-none z-20">
                <a href={`#/profile/${post.author.handle}`} className="font-bold flex items-center gap-2 pointer-events-auto w-fit">
                    {post.author.displayName || `@${post.author.handle}`}
                </a>
                <p className="text-sm mt-1 line-clamp-2">
                    <RichTextRenderer record={record} />
                </p>
            </div>
            
            <VideoActions post={post} />
            
            <button onClick={toggleMute} className="absolute top-4 right-4 bg-black/40 p-2 rounded-full text-white hover:bg-black/60 transition-colors z-20 pointer-events-auto">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </div>
    );
};

export default React.memo(VideoPlayer);
