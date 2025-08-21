import React, { useRef, useEffect, useState } from 'react';
import { useAtp } from '../../context/AtpContext';
import {AppBskyFeedDefs,AppBskyEmbedVideo,AppBskyEmbedRecordWithMedia,AppBskyActorDefs } from '@atproto/api';
import RichTextRenderer from '../shared/RichTextRenderer';
import VideoActions from './VideoActions';
import { Volume2, VolumeX } from 'lucide-react';
import SharedVideoPlayer, { PlayerRef } from '../shared/VideoPlayer';
import { View, Text, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';


interface VideoPlayerProps {
    postView: AppBskyFeedDefs.FeedViewPost;
    isActive: boolean;
    shouldLoad: boolean;
    hlsUrl?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ postView, isActive, shouldLoad, hlsUrl }) => {
    const { agent } = useAtp();
    const playerRef = useRef<PlayerRef | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    const { post } = postView;
    const record = post.record as any;

    let embedView: AppBskyEmbedVideo.View | undefined;
    if (AppBskyEmbedVideo.isView(post.embed)) embedView = post.embed;
    else if (AppBskyEmbedRecordWithMedia.isView(post.embed) && AppBskyEmbedVideo.isView(post.embed.media)) embedView = post.embed.media as AppBskyEmbedVideo.View;

    if (!embedView) return null;

    const authorDid = (post.author as AppBskyActorDefs.ProfileViewBasic).did;
    const videoCid = embedView.cid;
    if (!authorDid || !videoCid || !agent.service) return null;

    const serviceUrl = agent.service.toString();
    const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
    const blobVideoUrl = `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;

    const playerOptions = { autoplay: isActive, controls: false, poster: embedView.thumbnail, sources: [{ src: hlsUrl || blobVideoUrl, type: hlsUrl ? 'application/x-mpegURL' : 'video/mp4' }], loop: true, muted: isMuted, playsinline: true };
    
    useEffect(() => {
        if (playerRef.current) {
            if (isActive) {
                playerRef.current.playAsync()?.catch(() => {});
            } else {
                playerRef.current.pauseAsync();
                playerRef.current.setPositionAsync(0);
            }
        }
    }, [isActive]);

    const handlePlayerReady = (player: PlayerRef) => { 
        playerRef.current = player;
        setIsPlayerReady(true);
        if (isActive) {
            player.playAsync()?.catch(() => {});
        }
    };
    
    const handleVideoClick = async () => {
        if (!playerRef.current) return;
        const status = await playerRef.current.getStatusAsync();
        if (status.isLoaded) {
            if (status.isPlaying) {
                await playerRef.current.pauseAsync();
            } else {
                await playerRef.current.playAsync();
            }
        }
    };

    const toggleMute = (e: any) => { e.stopPropagation(); setIsMuted(prev => !prev); };

    if (!shouldLoad) return <View style={styles.container} />;

    return (
        <Pressable style={styles.container} onPress={handleVideoClick}>
            <SharedVideoPlayer options={playerOptions} onReady={handlePlayerReady} style={styles.video} />

            {!isPlayerReady && (
                <View style={styles.loadingOverlay}>
                    <Image source={{ uri: embedView.thumbnail }} style={styles.thumbnail} />
                    <ActivityIndicator size="large" color="white" />
                </View>
            )}
            
            <View style={styles.infoOverlay}>
                <Pressable onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.authorText}>{post.author.displayName || `@${post.author.handle}`}</Text>
                </Pressable>
                <Text style={styles.descriptionText} numberOfLines={2}>
                    <RichTextRenderer record={record} />
                </Text>
            </View>
            
            <VideoActions post={post} />
            
            <Pressable onPress={toggleMute} style={styles.muteButton}>
                {isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
            </Pressable>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%', height: '100%', backgroundColor: 'black' },
    video: { width: '100%', height: '100%' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 20 },
    thumbnail: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'contain', zIndex: -1 },
    infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 96, zIndex: 20 },
    authorText: { fontWeight: 'bold', color: 'white' },
    descriptionText: { fontSize: 14, color: 'white', marginTop: 4 },
    muteButton: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 999, zIndex: 20 },
});

export default React.memo(VideoPlayer);