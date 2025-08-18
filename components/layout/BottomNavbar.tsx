
import React from 'react';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { Home, Search, Edit3, LogOut, Bell, LogIn, LayoutGrid, MessageSquare } from 'lucide-react';

interface BottomNavbarProps {
  isHidden?: boolean;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ isHidden = false }) => {
  const { session, logout, unreadCount, chatUnreadCount, chatSupported } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const [currentHash, setCurrentHash] = React.useState(window.location.hash || '#/');

  React.useEffect(() => {
    const handler = () => setCurrentHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const baseLoggedInNavItems = [
    { href: '#/', label: 'Home', icon: Home, activeCondition: currentHash === '#/' || currentHash === '' },
    { href: '#/search', label: 'Search', icon: Search, activeCondition: currentHash.startsWith('#/search') },
    { isAction: true, action: () => openComposer(), label: 'Compose', icon: Edit3, activeCondition: false },
    { href: '#/messages', label: 'Messages', icon: MessageSquare, activeCondition: currentHash.startsWith('#/messages') },
    { href: '#/notifications', label: 'Notifications', icon: Bell, activeCondition: currentHash.startsWith('#/notifications') },
    { href: '#/more', label: 'More', icon: LayoutGrid, activeCondition: currentHash.startsWith('#/more') },
  ];

  const loggedInNavItems = chatSupported 
    ? baseLoggedInNavItems 
    : baseLoggedInNavItems.filter(item => item.label !== 'Messages');


  const guestNavItems = [
    { href: '#/', label: 'Home', icon: Home, activeCondition: currentHash === '#/' || currentHash === '' },
    { href: '#/search', label: 'Search', icon: Search, activeCondition: currentHash.startsWith('#/search') },
    { isAction: true, action: openLoginModal, label: 'Sign In', icon: LogIn, activeCondition: false },
  ];

  const navItems = session ? loggedInNavItems : guestNavItems;

  const renderNavItem = (item: (typeof navItems)[number]) => {
    const isNotifications = item.label === 'Notifications';
    const isMessages = item.label === 'Messages';
    const hasNotificationBadge = isNotifications && unreadCount > 0;
    const hasMessageBadge = isMessages && chatUnreadCount > 0;

    const content = (
      <>
        <div className={`relative w-16 h-8 flex items-center justify-center rounded-full transition-colors ${item.activeCondition ? 'bg-primary-container' : 'group-hover:bg-surface-3'}`}>
          <item.icon size={24} className={item.activeCondition ? 'text-on-primary-container' : 'text-on-surface-variant group-hover:text-on-surface'}/>
           {hasNotificationBadge && <div className="absolute top-1 right-3.5 w-2 h-2 bg-primary rounded-full"></div>}
           {hasMessageBadge && (
             <div className="absolute top-0 right-1.5 bg-primary text-on-primary text-[10px] font-bold rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
                {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
            </div>
           )}
        </div>
        <span className={`text-xs font-medium ${item.activeCondition ? 'text-on-surface' : 'text-on-surface-variant'}`}>{item.label}</span>
      </>
    );
    
    const commonClasses = "flex flex-col items-center justify-center gap-1 w-full h-full md:py-3 group transition-colors";

    if (item.isAction) {
      return (
        <button key={item.label} onClick={item.action} className={commonClasses} aria-label={item.label}>
          {content}
        </button>
      );
    }
    return (
      <a key={item.href} href={item.href} className={commonClasses} aria-label={item.label}>
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
            {loggedInNavItems.filter(item => item.label !== 'More' && item.label !== 'Logout').map(item => renderNavItem(item))}
        </div>
        {session && (
          <div className="flex flex-col items-center gap-4 w-full">
              {renderNavItem(loggedInNavItems.find(i => i.label === 'More')!)}
              <button onClick={logout} title="Logout" className="flex flex-col items-center justify-center gap-1 w-full group transition-colors">
                  <div className="w-16 h-8 flex items-center justify-center rounded-full transition-colors group-hover:bg-surface-3">
                      <LogOut size={22} className="text-on-surface-variant group-hover:text-on-surface"/>
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant">Logout</span>
              </button>
          </div>
        )}
        {!session && (
          <div className="flex flex-col items-center gap-4 w-full">
             {guestNavItems.filter(item => item.isAction).map(item => renderNavItem(item))}
          </div>
        )}
      </nav>
    </>
  );
};

export default BottomNavbar;
