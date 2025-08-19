import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { Home, Search, LogOut, Bell, LogIn, MessageSquareText, Users } from 'lucide-react';

interface BottomNavbarProps {
  isHidden?: boolean;
}

// Define explicit types for nav items to help TypeScript
type NavItemLink = {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  activeCondition: boolean;
  isAction?: undefined;
  action?: undefined;
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
  const { session, logout, unreadCount, chatUnreadCount } = useAtp();
  const { openLoginModal } = useUI();
  const [currentHash, setCurrentHash] = React.useState(window.location.hash || '#/');
  const { t } = useTranslation();

  React.useEffect(() => {
    const handler = () => setCurrentHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const loggedInNavItems: NavItem[] = [
    { href: '#/', labelKey: 'nav.home', icon: Users, activeCondition: currentHash === '#/' || currentHash === '' || currentHash.startsWith('#/channels') },
    { href: '#/search', labelKey: 'nav.search', icon: Search, activeCondition: currentHash.startsWith('#/search') },
    { href: '#/notifications', labelKey: 'nav.notifications', icon: Bell, activeCondition: currentHash.startsWith('#/notifications') },
    { href: '#/more', labelKey: 'nav.more', icon: MessageSquareText, activeCondition: currentHash.startsWith('#/more') || currentHash.startsWith('#/messages') },
  ];

  const guestNavItems: NavItem[] = [
    { href: '#/', labelKey: 'nav.home', icon: Home, activeCondition: currentHash === '#/' || currentHash === '' },
    { href: '#/search', labelKey: 'nav.search', icon: Search, activeCondition: currentHash.startsWith('#/search') },
    { isAction: true, action: openLoginModal, labelKey: 'nav.signIn', icon: LogIn, activeCondition: false },
  ];

  const navItems = session ? loggedInNavItems : guestNavItems;

  const renderNavItem = (item: NavItem) => {
    const isNotifications = item.labelKey === 'nav.notifications';
    const isMessages = item.labelKey === 'nav.more'; // Group messages under 'more' visually
    const hasNotificationBadge = isNotifications && unreadCount > 0;
    const hasMessageBadge = isMessages && chatUnreadCount > 0;
    
    const content = (
      <>
        <div className={`relative w-16 h-8 flex items-center justify-center rounded-full transition-colors ${item.activeCondition ? 'bg-primary-container' : 'group-hover:bg-surface-3'}`}>
          <item.icon size={24} className={item.activeCondition ? 'text-on-primary-container' : 'text-on-surface-variant group-hover:text-on-surface'}/>
          {hasNotificationBadge && (
             <div className="absolute top-0 right-1.5 bg-primary text-on-primary text-[10px] font-bold rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
            </div>
           )}
           {hasMessageBadge && (
             <div className="absolute top-0 right-1.5 bg-primary text-on-primary text-[10px] font-bold rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
            </div>
           )}
        </div>
        <span className={`text-xs font-medium ${item.activeCondition ? 'text-on-surface' : 'text-on-surface-variant'}`}>{t(item.labelKey)}</span>
      </>
    );
    
    const commonClasses = "flex flex-col items-center justify-center gap-1 w-full h-full md:py-3 group transition-colors";

    if (item.isAction) {
      return (
        <button key={item.labelKey} onClick={item.action} className={commonClasses} aria-label={t(item.labelKey)}>
          {content}
        </button>
      );
    }
    return (
      <a key={item.href} href={item.href} className={commonClasses} aria-label={t(item.labelKey)}>
        {content}
      </a>
    );
  };
  
  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className={`${isHidden ? 'hidden' : 'grid'} md:hidden fixed bottom-0 left-0 right-0 bg-surface-2 h-20 grid-cols-${navItems.length} items-center justify-around z-50`}>
        {navItems.map(item => renderNavItem(item))}
      </nav>

      {/* Desktop Navigation Rail */}
      <nav className="hidden md:flex fixed top-0 left-0 h-full w-20 bg-surface-2 flex-col items-center justify-between py-6 z-50">
        <div className="flex flex-col items-center gap-4 w-full">
            {loggedInNavItems.map(item => renderNavItem(item))}
        </div>
        {session && (
          <div className="flex flex-col items-center gap-4 w-full">
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
