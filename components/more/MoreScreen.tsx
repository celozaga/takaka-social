import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useProfileCache } from '../../context/ProfileCacheContext';
import { AppBskyActorDefs } from '@atproto/api';
import { 
    Settings, ChevronRight, BadgeCheck, List, Search, 
    Bell, Users, UserCheck, Clapperboard, MessageSquare
} from 'lucide-react';
import Head from '../shared/Head';

const AppGridItem: React.FC<{
    icon: React.ElementType,
    label: string,
    href?: string,
    onClick?: () => void,
    colorClass?: string
}> = ({ icon: Icon, label, href, onClick, colorClass }) => {
    const content = (
        <>
            <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center group-hover:bg-surface-3 transition-colors">
                <Icon size={32} className={colorClass || 'text-on-surface-variant'} />
            </div>
            <span className="text-xs text-center text-on-surface font-medium">{label}</span>
        </>
    );

    const className = "flex flex-col items-center justify-start gap-2 group";

    if (href) {
        return <a href={href} className={className}>{content}</a>;
    }
    return <button onClick={onClick} className={className}>{content}</button>;
};


const MoreScreen: React.FC = () => {
    const { session, chatSupported } = useAtp();
    const { getProfile } = useProfileCache();
    const { t } = useTranslation();
    const [profile, setProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (session?.did) {
            setIsLoading(true);
            getProfile(session.did)
                .then(setProfile)
                .catch(err => console.error("Failed to fetch profile for More screen:", err))
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [getProfile, session?.did]);
    
    const profileLink = `#/profile/${session?.handle}`;

    const baseAppGridItems = session ? [
        { icon: List, label: t('more.myFeeds'), href: '#/feeds', colorClass: 'text-sky-400' },
        { icon: MessageSquare, label: t('nav.messages'), href: '#/messages', colorClass: 'text-fuchsia-400' },
        { icon: Clapperboard, label: t('more.watch'), href: '#/watch', colorClass: 'text-rose-400' },
        { icon: Search, label: t('nav.search'), href: '#/search', colorClass: 'text-amber-400' },
        { icon: Bell, label: t('nav.notifications'), href: '#/notifications', colorClass: 'text-indigo-400' },
        { icon: Users, label: t('common.followers'), href: `#/profile/${session.handle}/followers`, colorClass: 'text-teal-400' },
        { icon: UserCheck, label: t('common.following'), href: `#/profile/${session.handle}/following`, colorClass: 'text-cyan-400' },
        { icon: Settings, label: t('nav.settings'), href: '#/settings', colorClass: 'text-slate-400' },
    ] : [];
    
    const appGridItems = chatSupported ? baseAppGridItems : baseAppGridItems.filter(item => item.label !== t('nav.messages'));

    return (
        <>
            <Head><title>{t('more.title')}</title></Head>
            <div className="pt-4">
                <div className="space-y-8">
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
                                    <img src={profile.avatar?.replace('/img/avatar/', '/img/avatar_thumbnail/')} alt="My Avatar" className="w-16 h-16 rounded-full bg-surface-3" />
                                    <div>
                                        <p className="font-bold text-lg flex items-center gap-1.5">
                                            <span>{profile.displayName || `@${profile.handle}`}</span>
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

                    {session && (
                        <div>
                            <h2 className="text-base font-bold text-on-surface-variant mb-4 px-1">{t('more.allApps')}</h2>
                            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                                {appGridItems.map(item => (
                                    <AppGridItem key={item.label} {...item} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MoreScreen;