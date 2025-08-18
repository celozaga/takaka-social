

import React from 'react';
import { useAtp } from '../../context/AtpContext';
import { Bell, UserCircle, ChevronRight, LogOut } from 'lucide-react';
import SettingsHeader from './SettingsHeader';
import { useUI } from '../../context/UIContext';

const SettingsScreen: React.FC = () => {
    const { logout } = useAtp();
    const { setCustomFeedHeaderVisible } = useUI();

    React.useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to sign out?")) {
            logout();
            window.location.hash = '#/';
        }
    }

    return (
        <div>
            <SettingsHeader />
            <div className="mt-4 space-y-2">
                <a href="#/settings/notifications" className="flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                        <Bell className="w-6 h-6 text-on-surface-variant" />
                        <span className="font-semibold">Notifications</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                </a>
                 <a href="#/settings/account" className="flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                        <UserCircle className="w-6 h-6 text-on-surface-variant" />
                        <span className="font-semibold">Account</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                </a>

                <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors mt-6">
                    <div className="flex items-center gap-4">
                        <LogOut className="w-6 h-6 text-error" />
                        <span className="font-semibold text-error">Sign Out</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default SettingsScreen;