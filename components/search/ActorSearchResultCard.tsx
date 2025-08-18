import React, { useState } from 'react';
import { AppBskyActorDefs } from '@atproto/api';
import { useAtp } from '../../context/AtpContext';
import { useToast } from '../ui/use-toast';
import { BadgeCheck } from 'lucide-react';

interface ActorSearchResultCardProps {
  actor: AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed;
}

const ActorSearchResultCard: React.FC<ActorSearchResultCardProps> = ({ actor }) => {
  const { agent, session } = useAtp();
  const { toast } = useToast();
  const [viewerState, setViewerState] = useState(actor.viewer);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const profileLink = `#/profile/${actor.handle}`;

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isActionLoading || !session) return;
    setIsActionLoading(true);
    const oldViewerState = viewerState;
    setViewerState(prev => ({ ...prev, following: 'temp-uri' }));
    try {
      const { uri } = await agent.follow(actor.did);
      setViewerState(prev => ({ ...prev, following: uri }));
    } catch (err) {
      console.error("Failed to follow:", err);
      toast({ title: "Error", description: "Could not follow user.", variant: "destructive" });
      setViewerState(oldViewerState);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnfollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!viewerState?.following || isActionLoading) return;
    setIsActionLoading(true);
    const oldViewerState = viewerState;
    setViewerState(prev => ({ ...prev, following: undefined }));
    try {
      await agent.deleteFollow(viewerState.following);
    } catch (err) {
      console.error("Failed to unfollow:", err);
      toast({ title: "Error", description: "Could not unfollow user.", variant: "destructive" });
      setViewerState(oldViewerState);
    } finally {
      setIsActionLoading(false);
    }
  };

  const FollowButton = () => {
    if (!session) return null;

    return (
      <button
        onClick={viewerState?.following ? handleUnfollow : handleFollow}
        disabled={isActionLoading}
        className={`font-semibold text-sm py-1.5 px-4 rounded-full transition-colors duration-200 flex-shrink-0
            ${viewerState?.following
              ? 'bg-surface-3 text-on-surface hover:bg-surface-3/80'
              : 'bg-primary text-on-primary hover:bg-primary/90'
            }
            disabled:opacity-50`}
      >
        {viewerState?.following ? 'Following' : 'Follow'}
      </button>
    );
  };

  return (
    <a href={profileLink} className="block p-4 bg-surface-2 rounded-xl hover:bg-surface-3 transition-colors">
      <div className="flex items-start gap-4">
        <img src={actor.avatar} alt={actor.displayName || actor.handle} className="w-12 h-12 rounded-full bg-surface-3 flex-shrink-0" loading="lazy" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="min-w-0">
              <div className="font-bold truncate flex items-center gap-1">
                  <span className="truncate">{actor.displayName || `@${actor.handle}`}</span>
                  {actor.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                    <BadgeCheck size={16} className="text-primary flex-shrink-0" fill="currentColor" />
                  )}
              </div>
              <p className="text-on-surface-variant text-sm truncate">@{actor.handle}</p>
            </div>
            <div className="ml-2">
                <FollowButton />
            </div>
          </div>
          {actor.description && (
            <div className="mt-2 text-sm text-on-surface line-clamp-2 break-words">
              {actor.description}
            </div>
          )}
        </div>
      </div>
    </a>
  );
};

export default React.memo(ActorSearchResultCard);