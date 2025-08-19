
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { Home, Search, LogOut, Bell, LogIn, Users } from 'lucide-react';

interface BottomNavbarProps {
  isHidden?: boolean;
}

type NavItemLink = {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  activeCondition: boolean;
  isAction?: false;
};

type NavItemAction = {
  isAction: true;
  action: () => void;
  labelKey: string;
  icon: React.ElementType;
  activeCondition: boolean;
  href?: undefined;
};

type NavItem = NavItemLink | NavItemAction;

const BottomNavbar: React.FC<BottomNavbarProps> = ({ isHidden = false }) => {
  const { session, profile, logout, unreadCount } = useAtp();
  const { openLoginModal } = useUI();
  const [currentHash, setCurrentHash] = React.useState(window.location.hash || '#/');
  const { t } = useTranslation();

  React.useEffect(() => {
    const handler = () => setCurrentHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const loggedInNavItems: NavItem[] = [
    { href: '#/', labelKey: 'nav.channels', icon: Users, activeCondition: currentHash === '#/' || currentHash === '' || currentHash.startsWith('#/channels') },
    { href: '#/search', labelKey: 'nav.search', icon: Search, activeCondition: currentHash.startsWith('#/search') },
    { href: '#/notifications', labelKey: 'nav.notifications', icon: Bell, activeCondition: currentHash.startsWith('#/notifications') },
  ];
  
  const guestNavItems: NavItem[] = [
    { href: '#/', labelKey: 'nav.home', icon: Home, activeCondition: currentHash === '#/' || currentHash === '' },
    { href: '#/search', labelKey: 'nav.search', icon: Search, activeCondition: currentHash.startsWith('#/search') },
    { isAction: true, action: openLoginModal, labelKey: 'nav.signIn', icon: LogIn, activeCondition: false },
  ];

  const navItems = session ? loggedInNavItems : guestNavItems;
  
  const renderNavItem = (item: NavItem) => {
    const isNotifications = item.labelKey === 'nav.notifications';
    const hasBadge = isNotifications && unreadCount > 0;
    
    const content = (
      <>
        <div className={`relative w-16 h-8 flex items-center justify-center rounded-full transition-colors ${item.activeCondition ? 'bg-primary-container' : 'group-hover:bg-surface-3'}`}>
          <item.icon size={24} className={item.activeCondition ? 'text-on-primary-container' : 'text-on-surface-variant group-hover:text-on-surface'}/>
          {hasBadge && <div className="absolute top-1 right-3.5 w-2 h-2 bg-primary rounded-full"></div>}
        </div>
        <span className={`text-xs font-medium ${item.activeCondition ? 'text-on-surface' : 'text-on-surface-variant'}`}>{t(item.labelKey)}</span>
      </>
    );
    
    const commonClasses = "flex flex-col items-center justify-center gap-1 w-full h-full md:py-3 group transition-colors";

    if (item.isAction === true) {
      return <button key={item.labelKey} onClick={item.action} className={commonClasses} aria-label={t(item.labelKey)}>{content}</button>;
    }
    return <a key={item.href} href={item.href} className={commonClasses} aria-label={t(item.labelKey)}>{content}</a>;
  };
  
  return (
    <>
      <nav className={`${isHidden ? 'hidden' : 'grid'} md:hidden fixed bottom-0 left-0 right-0 bg-surface-2 h-20 grid-cols-${navItems.length} items-center justify-around z-50`}>
        {navItems.map(item => renderNavItem(item))}
      </nav>
      <nav className="hidden md:flex fixed top-0 left-0 h-full w-20 bg-surface-2 flex-col items-center justify-between py-6 z-50">
        <div className="flex flex-col items-center gap-4 w-full">
            {session ? loggedInNavItems.map(item => renderNavItem(item)) : guestNavItems.filter(item => !item.isAction).map(item => renderNavItem(item))}
        </div>
        {session && profile && (
          <div className="flex flex-col items-center gap-4 w-full">
              <a href={`#/profile/${session.handle}`} title="Profile" className="flex flex-col items-center justify-center gap-1 w-full group transition-colors">
                  <div className="w-16 h-8 flex items-center justify-center rounded-full transition-colors group-hover:bg-surface-3">
                      <img src={profile.avatar} className="w-8 h-8 rounded-full bg-surface-3" />
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant">Profile</span>
              </a>
              <button onClick={logout} title={t('nav.logout')} className="flex flex-col items-center justify-center gap-1 w-full group transition-colors">
                  <div className="w-16 h-8 flex items-center justify-center rounded-full transition-colors group-hover:bg-surface-3">
                      <LogOut size={22} className="text-on-surface-variant group-hover:text-on-surface"/>
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant">{t('nav.logout')}</span>
              </button>
          </div>
        )}
        {!session && (
          <div className="flex flex-col items-center gap-4 w-full">
             {guestNavItems.filter((item): item is NavItemAction => !!item.isAction).map(item => renderNavItem(item))}
          </div>
        )}
      </nav>
    </>
  );
};

export default BottomNavbar;
