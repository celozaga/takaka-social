
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../ui/use-toast';
import { usePostActions } from '../../hooks/usePostActions';
import { useUI } from '../../context/UIContext';
import { AppBskyFeedDefs, AtUri } from '@atproto/api';
import { Repeat, Share2, Loader2 } from 'lucide-react';

interface RepostModalProps {
  post: AppBskyFeedDefs.PostView;
  onClose: () => void;
}

const ActionListItem: React.FC<{
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}> = ({ icon: Icon, label, onClick, disabled = false }) => {
    return (
        <li>
            <button 
                onClick={onClick}
                disabled={disabled}
                className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-surface-3 disabled:opacity-50"
            >
                <Icon className="w-6 h-6 text-on-surface-variant" />
                <span className="font-semibold text-on-surface">{label}</span>
            </button>
        </li>
    );
};

const RepostModal: React.FC<RepostModalProps> = ({ post, onClose }) => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { repostUri, isReposting, handleRepost } = usePostActions(post);

    const [isLoading, setIsLoading] = useState(false);
    
    const handleDirectRepost = async () => {
        if (repostUri) return; // Already reposted
        setIsLoading(true);
        try {
            await handleRepost();
            toast({ title: t('repostModal.repostSuccess') });
            onClose();
        } catch (e) {
            // Error toast is handled by usePostActions
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async () => {
        const postUrl = `${window.location.origin}/#/post/${post.author.did}/${new AtUri(post.uri).rkey}`;
        const shareData = {
            title: t('post.byline', { user: post.author.handle }),
            text: (post.record as any)?.text,
            url: postUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback for desktop or unsupported browsers
            await navigator.clipboard.writeText(postUrl);
            toast({ title: t('post.linkCopied') });
        }
        onClose();
    };

    return (
        <div className="bg-surface-2 rounded-t-xl">
            <div className="w-10 h-1.5 bg-outline mx-auto my-3 rounded-full" />
            
            <div className="relative">
                {isLoading && <div className="absolute inset-0 bg-surface-2/50 flex items-center justify-center z-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
                
                <ul className="divide-y divide-surface-3">
                    <ActionListItem 
                        icon={Repeat} 
                        label={t('repostModal.repost')} 
                        onClick={handleDirectRepost}
                        disabled={!!repostUri || isReposting}
                    />
                    <ActionListItem 
                        icon={Share2} 
                        label={t('repostModal.share')} 
                        onClick={handleShare} 
                    />
                </ul>
            </div>
        </div>
    );
};

export default RepostModal;
