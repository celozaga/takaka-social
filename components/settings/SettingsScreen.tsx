

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { Bell, UserCircle, LogOut, Globe, ChevronRight } from 'lucide-react';
import ScreenHeader from '../layout/ScreenHeader';
import { useUI } from '../../context/UIContext';
import { supportedLanguages } from '../../lib/i18n';
import { useHeadManager } from '../../hooks/useHeadManager';

const SettingsScreen: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { logout } = useAtp();
    const { setCustomFeedHeaderVisible } = useUI();

    useHeadManager({ title: t('settings.title') });

    React.useEffect(() => {
        setCustomFeedHeaderVisible(true);
        return () => setCustomFeedHeaderVisible(false);
    }, [setCustomFeedHeaderVisible]);

    const handleLogout = () => {
        if (window.confirm(t('settings.signOutConfirm'))) {
            logout();
            window.location.hash = '#/';
        }
    }

    const currentLanguageName = supportedLanguages.find(l => i18n.language.startsWith(l.code))?.name || 'English';

    return (
        <div>
            <ScreenHeader title={t('settings.title')} />
            <div className="mt-4 space-y-2">
                <a href="#/settings/language" className="flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                        <Globe className="w-6 h-6 text-on-surface-variant" />
                        <span className="font-semibold">{t('settings.language')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-on-surface-variant text-sm">{currentLanguageName}</span>
                        <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                    </div>
                </a>
                <a href="#/settings/notifications" className="flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                        <Bell className="w-6 h-6 text-on-surface-variant" />
                        <span className="font-semibold">{t('settings.notifications')}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                </a>
                 <a href="#/settings/account" className="flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                        <UserCircle className="w-6 h-6 text-on-surface-variant" />
                        <span className="font-semibold">{t('settings.account')}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                </a>

                <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 bg-surface-2 hover:bg-surface-3 rounded-lg transition-colors mt-6">
                    <div className="flex items-center gap-4">
                        <LogOut className="w-6 h-6 text-error" />
                        <span className="font-semibold text-error">{t('settings.signOut')}</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default SettingsScreen;
