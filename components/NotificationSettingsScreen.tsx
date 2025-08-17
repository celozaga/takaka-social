
import React from 'react';
import { Heart, UserPlus, MessageCircle, AtSign, Repeat, Users, Quote, MoreHorizontal, ChevronRight } from 'lucide-react';
import NotificationSettingsHeader from './NotificationSettingsHeader';
import { useUI } from '../context/UIContext';

const settingsItems = [
    { icon: Heart, title: 'Likes', subtitle: 'In-app, Push, Everyone' },
    { icon: UserPlus, title: 'New followers', subtitle: 'In-app, Everyone' },
    { icon: MessageCircle, title: 'Replies', subtitle: 'In-app, Push, Everyone' },
    { icon: AtSign, title: 'Mentions', subtitle: 'In-app, Push, Everyone' },
    { icon: Quote, title: 'Quotes', subtitle: 'In-app, Push, Everyone' },
    { icon: Repeat, title: 'Reposts', subtitle: 'In-app, Push, Everyone' },
    { icon: Users, title: 'Activity from others', subtitle: 'In-app, Push' },
    { icon: Heart, title: 'Likes of your reposts', subtitle: 'In-app, Push' },
    { icon: Repeat, title: 'Reposts of your reposts', subtitle: 'In-app, Push' },
    { icon: MoreHorizontal, title: 'Everything else', subtitle: 'In-app, Push' },
];

const NotificationSettingsScreen: React.FC = () => {
    const { setCustomFeedHeaderVisible } = useUI();

     React.useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    return (
        <div>
            <NotificationSettingsHeader />
            <div className="mt-4 space-y-1">
                {settingsItems.map((item, index) => (
                    <a key={index} href="#" className="flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                            <item.icon className="w-6 h-6 text-on-surface-variant" />
                            <div>
                                <p className="font-semibold">{item.title}</p>
                                <p className="text-sm text-on-surface-variant">{item.subtitle}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                    </a>
                ))}
            </div>
             <p className="text-center text-on-surface-variant text-sm mt-8 px-4">
                Notification customization is coming soon.
            </p>
        </div>
    );
};

export default NotificationSettingsScreen;
