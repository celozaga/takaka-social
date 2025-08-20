
import React from 'react';
import { AppBskyActorDefs } from '@atproto/api';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface ConvoHeaderProps {
  peer: AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed | null;
  isLoading: boolean;
}

const ConvoHeader: React.FC<ConvoHeaderProps> = ({ peer, isLoading }) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4 text-white">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-white/10">
          <ArrowLeft size={20} />
        </button>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
        {!isLoading && peer && (
          <a href={`#/profile/${peer.handle}`} className="flex items-center gap-3 truncate">
            <img src={peer.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} alt={peer.displayName} className="w-8 h-8 rounded-full bg-surface-3" />
            <div className="font-bold truncate leading-tight">
              <span className="truncate">{peer.displayName || `@${peer.handle}`}</span>
              {peer.displayName && <p className="text-xs font-normal opacity-70">@{peer.handle}</p>}
            </div>
          </a>
        )}
        {/* Placeholder to balance the back button */}
        <div className="w-8"></div>
      </div>
    </header>
  );
};

export default ConvoHeader;