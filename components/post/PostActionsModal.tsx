import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useHiddenPosts } from '../../context/HiddenPostsContext';
import { AtUri, AppBskyActorDefs, AppBskyFeedDefs } from '@atproto/api';
import {
  Share2, Globe, Copy, EyeOff, MicOff, Shield, AlertTriangle, Trash2, X, Loader2, ShieldOff
} from 'lucide-react';

interface PostActionsModalProps {
  post: AppBskyFeedDefs.PostView;
  author: AppBskyActorDefs.ProfileViewDetailed;
  onClose: () => void;
  onViewerStateChange: (newViewerState: AppBskyActorDefs.ViewerState) => void;
}

const ActionButton: React.FC<{
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    isDestructive?: boolean;
    disabled?: boolean;
}> = ({ icon: Icon, label, onClick, isDestructive = false, disabled = false }) => {
    const textClass = isDestructive ? 'text-error' : 'text-on-surface';
    const hoverClass = isDestructive ? 'hover:bg-error/10' : 'hover:bg-surface-3';
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${hoverClass} disabled:opacity-50`}
        >
            <Icon className={`w-6 h-6 ${isDestructive ? 'text-error' : 'text-on-surface-variant'}`} />
            <span className={`font-semibold ${textClass}`}>{label}</span>
        </button>
    );
};

const PostActionsModal: React.FC<PostActionsModalProps> = ({ post, author, onClose, onViewerStateChange }) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { hidePost } = useHiddenPosts();

    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [viewerState, setViewerState] = useState(author.viewer);
    
    useEffect(() => {
        setViewerState(author.viewer);
    }, [author]);

    if (!post) return null;

    const isMe = post.author.did === session?.did;
    const postUrl = `${window.location.origin}/#/post/${post.author.did}/${new AtUri(post.uri).rkey}`;
    const postText = (post.record as any)?.text || '';

    const handleShare = () => {
        navigator.clipboard.writeText(postUrl);
        toast({ title: "Link Copied!", description: "Post URL has been copied to your clipboard." });
        onClose();
    };
    
    const handleTranslate = () => {
        const lang = navigator.language.split('-')[0];
        window.open(`https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(postText)}&op=translate`, '_blank');
        onClose();
    };
    
    const handleCopyText = () => {
        navigator.clipboard.writeText(postText);
        toast({ title: "Text Copied!" });
        onClose();
    };
    
    const handleHide = () => {
        hidePost(post.uri);
        toast({ title: "Post Hidden", description: "This post will no longer be shown to you." });
        onClose();
    };
    
    const handleMute = async () => {
        setIsActionLoading('mute');
        const oldViewerState = viewerState;
        const newViewerState = { ...viewerState, muted: true };
        setViewerState(newViewerState);
        onViewerStateChange(newViewerState);
        try {
            await agent.mute(post.author.did);
            toast({ title: "User Muted" });
            onClose();
        } catch (e) {
            setViewerState(oldViewerState);
            onViewerStateChange(oldViewerState);
            toast({ title: "Error", description: "Could not mute user.", variant: "destructive" });
        } finally {
            setIsActionLoading(null);
        }
    }
    
    const handleUnmute = async () => {
        setIsActionLoading('mute');
        const oldViewerState = viewerState;
        const newViewerState = { ...viewerState, muted: false };
        setViewerState(newViewerState);
        onViewerStateChange(newViewerState);
        try {
            await agent.unmute(post.author.did);
            toast({ title: "User Unmuted" });
            onClose();
        } catch (e) {
            setViewerState(oldViewerState);
            onViewerStateChange(oldViewerState);
            toast({ title: "Error", description: "Could not unmute user.", variant: "destructive" });
        } finally {
            setIsActionLoading(null);
        }
    }

    const handleBlock = async () => {
        if (!window.confirm(`Are you sure you want to block @${post.author.handle}?`)) return;
        setIsActionLoading('block');
        const oldViewerState = viewerState;
        const newViewerState = { ...viewerState, blocking: 'temp-uri', following: undefined };
        setViewerState(newViewerState);
        onViewerStateChange(newViewerState);
        try {
            const { uri } = await agent.app.bsky.graph.block.create(
                { repo: session!.did }, 
                { subject: post.author.did, createdAt: new Date().toISOString() }
            );
            const finalViewerState = { ...newViewerState, blocking: uri };
            setViewerState(finalViewerState);
            onViewerStateChange(finalViewerState);
            toast({ title: "User Blocked" });
            onClose();
        } catch (e) {
            setViewerState(oldViewerState);
            onViewerStateChange(oldViewerState);
            toast({ title: "Error", description: "Could not block user.", variant: "destructive" });
        } finally {
            setIsActionLoading(null);
        }
    };
    
    const handleReport = () => {
        const subject = "Report Post";
        const body = `Reason for reporting:\n\nPost URL: ${postUrl}`;
        window.location.href = `mailto:moderation@blueskyweb.xyz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        onClose();
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
        setIsActionLoading('delete');
        try {
            await agent.deletePost(post.uri);
            toast({ title: "Post Deleted" });
            onClose();
            // Go back to the previous page as the current one is gone
            setTimeout(() => window.history.back(), 200);
        } catch (e) {
            toast({ title: "Error", description: "Could not delete post.", variant: "destructive" });
        } finally {
            setIsActionLoading(null);
        }
    };

    return (
        <div className="pb-4">
            <div className="flex justify-center p-3">
                <div className="w-10 h-1.5 bg-outline rounded-full" />
            </div>
            <div className="relative">
                 {isActionLoading && <div className="absolute inset-0 bg-surface-2/50 flex items-center justify-center z-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
                <ActionButton icon={Share2} label="Share Post" onClick={handleShare} />
                <ActionButton icon={Globe} label="Translate" onClick={handleTranslate} />
                {postText && <ActionButton icon={Copy} label="Copy Post Text" onClick={handleCopyText} />}
                <ActionButton icon={EyeOff} label="Hide post for me" onClick={handleHide} />
                {!isMe && (
                    <>
                        <ActionButton icon={viewerState?.muted ? MicOff : MicOff} label={viewerState?.muted ? "Unmute Account" : "Mute Account"} onClick={viewerState?.muted ? handleUnmute : handleMute} />
                        <ActionButton icon={Shield} label="Block Account" onClick={handleBlock} isDestructive />
                    </>
                )}
                <ActionButton icon={AlertTriangle} label="Report Post" onClick={handleReport} isDestructive />
                {isMe && <ActionButton icon={Trash2} label="Delete Post" onClick={handleDelete} isDestructive />}
            </div>
        </div>
    );
};

export default PostActionsModal;
