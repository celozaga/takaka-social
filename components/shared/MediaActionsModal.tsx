
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useHiddenPosts } from '../../context/HiddenPostsContext';
import { 
  AtUri, 
  AppBskyFeedDefs, 
  AppBskyEmbedImages, 
  AppBskyEmbedRecordWithMedia, 
  AppBskyEmbedVideo 
} from '@atproto/api';
import {
  Share2, Download, EyeOff, MicOff, Shield, AlertTriangle, Trash2, X, Loader2, ShieldOff, Languages
} from 'lucide-react';

interface MediaActionsModalProps {
  post: AppBskyFeedDefs.PostView;
  onClose: () => void;
}

const ActionListItem: React.FC<{
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    isDestructive?: boolean;
    disabled?: boolean;
}> = ({ icon: Icon, label, onClick, isDestructive = false, disabled = false }) => {
    const textClass = isDestructive ? 'text-error' : 'text-on-surface';
    const hoverClass = isDestructive ? 'hover:bg-error/10' : 'hover:bg-surface-3';
    return (
        <li>
            <button 
                onClick={onClick}
                disabled={disabled}
                className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${hoverClass} disabled:opacity-50`}
            >
                <Icon className={`w-6 h-6 ${isDestructive ? 'text-error' : 'text-on-surface-variant'}`} />
                <span className={`font-semibold ${textClass}`}>{label}</span>
            </button>
        </li>
    );
};

const MediaActionsModal: React.FC<MediaActionsModalProps> = ({ post, onClose }) => {
    const { agent, session } = useAtp();
    const { toast } = useToast();
    const { hidePost } = useHiddenPosts();
    const { t, i18n } = useTranslation();

    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [viewerState, setViewerState] = useState(post.author.viewer);

    if (!post) return null;

    const isMe = post.author.did === session?.did;
    const postUrl = `${window.location.origin}/#/post/${post.author.did}/${new AtUri(post.uri).rkey}`;
    
    const getMediaInfo = useCallback(() => {
        if (!post.embed) return null;
        let embed = post.embed;
        if (AppBskyEmbedRecordWithMedia.isView(embed)) {
            embed = embed.media;
        }

        const rkey = new AtUri(post.uri).rkey;
        const handle = post.author.handle;

        if (AppBskyEmbedImages.isView(embed) && embed.images.length > 0) {
            return {
                type: 'image' as const,
                url: embed.images[0].fullsize,
                filename: `takaka-${handle}-${rkey}.jpg`
            };
        }
        if (AppBskyEmbedVideo.isView(embed)) {
            const authorDid = post.author.did;
            const videoCid = embed.cid;
            if (!authorDid || !videoCid || !agent.service) return null;
            const serviceUrl = agent.service.toString();
            const baseUrl = serviceUrl.endsWith('/') ? serviceUrl : `${serviceUrl}/`;
            return {
                type: 'video' as const,
                url: `${baseUrl}xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`,
                filename: `takaka-${handle}-${rkey}.mp4`
            };
        }
        return null;
    }, [post, agent.service]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(postUrl);
        toast({ title: t('mediaActions.toast.linkCopied') });
    };
    
    const handleShare = async () => {
        const text = (post.record as any)?.text;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('post.byline', { user: `@${post.author.handle}` }),
                    text: text,
                    url: postUrl,
                });
            } catch (error) {
                console.info('Web Share API canceled or failed, falling back to copy.', error);
                handleCopyLink();
            }
        } else {
            handleCopyLink();
        }
        onClose();
    };

    const handleTranslate = () => {
        const textToTranslate = (post.record as any)?.text;
        if (textToTranslate) {
            const lang = i18n.language.split('-')[0];
            const url = `https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(textToTranslate)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        onClose();
    };
    
    const handleDownload = async () => {
        const mediaInfo = getMediaInfo();
        if (!mediaInfo) {
            toast({ title: t('common.error'), description: t('mediaActions.toast.downloadError'), variant: 'destructive' });
            return;
        }
        setIsLoading('download');
        toast({ title: t('mediaActions.toast.downloadStarting') });
        try {
            const response = await fetch(mediaInfo.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = mediaInfo.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Download failed:', error);
            toast({ title: t('common.error'), description: t('mediaActions.toast.downloadError'), variant: 'destructive' });
        } finally {
            setIsLoading(null);
            onClose();
        }
    };
    
    const handleHide = () => {
        hidePost(post.uri);
        toast({ title: t('postActions.toast.postHidden'), description: t('postActions.toast.postHiddenDescription') });
        onClose();
    };
    
    const handleMute = async (mute: boolean) => {
        setIsLoading('mute');
        try {
            if (mute) {
                await agent.mute(post.author.did);
                toast({ title: t('profile.toast.muteSuccess') });
            } else {
                await agent.unmute(post.author.did);
                toast({ title: t('profile.toast.unmuteSuccess') });
            }
            setViewerState(prev => ({ ...prev, muted: mute }));
        } catch (e) {
            toast({ title: t('common.error'), description: mute ? t('profile.toast.muteError') : t('profile.toast.unmuteError'), variant: "destructive" });
        } finally {
            setIsLoading(null);
            onClose();
        }
    };

    const handleBlock = async (block: boolean) => {
        if (block && !window.confirm(t('profile.confirmBlock', { handle: post.author.handle }))) return;
        setIsLoading('block');
        try {
            if (block) {
                const { uri } = await agent.app.bsky.graph.block.create({ repo: session!.did }, { subject: post.author.did, createdAt: new Date().toISOString() });
                toast({ title: t('profile.toast.blockSuccess') });
                setViewerState(prev => ({ ...prev, blocking: uri, following: undefined }));
            } else if (viewerState?.blocking) {
                await agent.app.bsky.graph.block.delete({ repo: session!.did, rkey: new AtUri(viewerState.blocking).rkey });
                toast({ title: t('profile.toast.unblockSuccess') });
                setViewerState(prev => ({ ...prev, blocking: undefined }));
            }
        } catch (e) {
            toast({ title: t('common.error'), description: block ? t('profile.toast.blockError') : t('profile.toast.unblockError'), variant: "destructive" });
        } finally {
            setIsLoading(null);
            onClose();
        }
    };

    const handleReport = () => {
        const subject = "Report Post";
        const body = `Reason for reporting:\n\nPost URL: ${postUrl}`;
        window.location.href = `mailto:moderation@blueskyweb.xyz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        onClose();
    };

    const handleDelete = async () => {
        if (!window.confirm(t('postActions.confirmDelete'))) return;
        setIsLoading('delete');
        try {
            await agent.deletePost(post.uri);
            toast({ title: t('postActions.toast.deleteSuccess') });
            onClose();
            if (window.location.hash.includes(`/post/${post.author.did}`)) {
                setTimeout(() => window.history.back(), 200);
            }
        } catch (e) {
            toast({ title: t('common.error'), description: t('postActions.toast.deleteError'), variant: "destructive" });
        } finally {
            setIsLoading(null);
        }
    };
    
    const hasText = !!(post.record as any)?.text?.trim();
    const mediaInfo = getMediaInfo();

    return (
        <div className="bg-surface-2 rounded-t-xl">
            <header className="flex items-center justify-between p-4">
                <h2 className="font-bold text-lg">{t('mediaActions.title')}</h2>
                <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-surface-3">
                    <X />
                </button>
            </header>

            <div className="relative max-h-[70vh] overflow-y-auto">
                {isLoading && <div className="absolute inset-0 bg-surface-2/50 flex items-center justify-center z-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
                
                <ul className="divide-y divide-surface-3">
                    <ActionListItem icon={Share2} label={t('mediaActions.shareVia')} onClick={handleShare} />
                    {hasText && <ActionListItem icon={Languages} label={t('mediaActions.translate')} onClick={handleTranslate} />}
                    {mediaInfo && <ActionListItem icon={Download} label={mediaInfo.type === 'image' ? t('mediaActions.downloadPhoto') : t('mediaActions.downloadVideo')} onClick={handleDownload} />}
                    <ActionListItem icon={EyeOff} label={t('mediaActions.notInterested')} onClick={handleHide} />
                    {!isMe && (
                        <>
                            <ActionListItem icon={MicOff} label={viewerState?.muted ? t('mediaActions.unmuteUser', { handle: post.author.handle }) : t('mediaActions.muteUser', { handle: post.author.handle })} onClick={() => handleMute(!viewerState?.muted)} />
                            <ActionListItem icon={viewerState?.blocking ? ShieldOff : Shield} label={viewerState?.blocking ? t('mediaActions.unblockUser', { handle: post.author.handle }) : t('mediaActions.blockUser', { handle: post.author.handle })} onClick={() => handleBlock(!viewerState?.blocking)} isDestructive />
                        </>
                    )}
                    <ActionListItem icon={AlertTriangle} label={t('postActions.report')} onClick={handleReport} isDestructive />
                    {isMe && <ActionListItem icon={Trash2} label={t('postActions.delete')} onClick={handleDelete} isDestructive />}
                </ul>
            </div>
        </div>
    );
};

export default MediaActionsModal;
