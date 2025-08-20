
import React from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';

interface ProfileHeaderProps {
    handle: string;
    onMoreClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ handle, onMoreClick }) => {
    return (
        <div className="sticky top-0 -mx-4 -mt-4 px-4 bg-surface-1 z-30">
            <div className="flex items-center justify-between h-16">
                <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-surface-3">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-center truncate">@{handle}</h1>
                <button onClick={onMoreClick} className="p-2 rounded-full hover:bg-surface-3">
                    <MoreHorizontal size={24} />
                </button>
            </div>
        </div>
    );
};

export default ProfileHeader;