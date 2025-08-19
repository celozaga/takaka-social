
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { useHiddenPosts } from '../../context/HiddenPostsContext';
import { 
  AtUri, 
  AppBskyFeedDefs
} from '@atproto/api';
import {
  EyeOff, MicOff, Shield, AlertTriangle, Trash2, X, Loader2, ShieldOff
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
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [viewerState, setViewerState] = useState(post.author.viewer);

    if (!post) return null;

    const isMe = post.author.did === session?.did;
    const postUrl = `${window.location.origin}/#/post/${post.author.did}/${new AtUri(post.uri).rkey}`;
    
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
