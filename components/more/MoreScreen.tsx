

import React, { useState, useEffect } from 'react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { AppBskyActorDefs } from '@atproto/api';
import { Settings, ChevronRight, BadgeCheck, List } from 'lucide-react';
import MoreHeader from './MoreHeader';

const MoreScreen: React.FC = () => {
    const { agent, session } = useAtp();
    const { setCustomFeedHeaderVisible } = useUI();
    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    useEffect(() => {
        if (session?.did) {
            setIsLoading(true);
            agent.getProfile({ actor: session.did })
                .then(({ data }) => setProfile(data))
                .catch(err => console.error("Failed to fetch profile for More screen:", err))
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [agent, session?.did]);
    
    const profileLink = `#/profile/${session?.handle}`;

    return (
        <div>
            <MoreHeader />
            <div className="mt-4 space-y-4">
                {isLoading ? (
                    <div className="bg-surface-2 rounded-lg p-4 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-surface-3"></div>
                            <div className="space-y-2">
                                <div className="h-5 w-32 bg-surface-3 rounded"></div>
                                <div className="h-4 w-24 bg-surface-3 rounded"></div>
                            </div>
                        </div>
                    </div>
                ) : profile && (
                    <a href={profileLink} className="block bg-surface-2 rounded-lg p-4 hover:bg-surface-3 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src={profile.avatar} alt="My Avatar" className="w-16 h-16 rounded-full bg-surface-3" />
                                <div>
                                    <p className="font-bold text-lg flex items-center gap-1.5">
                                        <span>{profile.displayName}</span>
                                        {profile.labels?.some(l => l.val === 'blue-check' && l.src === 'did:plc:z72i7hdynmk6r22z27h6tvur') && (
                                            <BadgeCheck className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" />
                                        )}
                                    </p>
                                    <p className="text-on-surface-variant">@{profile.handle}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-on-surface-variant" />
                        </div>
                    </a>
                )}

                <div className="space-y-2">
                    <a href="#/feeds" className="flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors">
                        <div className="flex items-center gap-4">
                            <List className="w-6 h-6 text-on-surface-variant" />
                            <span className="font-semibold">My Feeds</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                    </a>
                    <a href="#/settings" className="flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors">
                        <div className="flex items-center gap-4">
                            <Settings className="w-6 h-6 text-on-surface-variant" />
                            <span className="font-semibold">Settings</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default MoreScreen;