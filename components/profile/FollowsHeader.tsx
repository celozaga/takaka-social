
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface FollowsHeaderProps {
  type: 'followers' | 'following';
}

const FollowsHeader: React.FC<FollowsHeaderProps> = ({ type }) => {
    const title = type === 'followers' ? 'Followers' : 'Following';
    return (
        <div className="sticky top-0 -mx-4 -mt-4 px-4 bg-surface-1 z-30">
            <div className="flex items-center gap-4 h-16">
                <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-surface-3">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold capitalize">{title}</h1>
            </div>
        </div>
    );
};

export default FollowsHeader;
