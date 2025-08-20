import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, usePathname } from 'expo-router';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { Home, Search, Edit3, LogOut, Bell, LogIn, LayoutGrid } from 'lucide-react';
import { View, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';


interface BottomNavbarProps {
  isHidden?: boolean;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ isHidden = false }) => {
  const { session, logout, unreadCount } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const loggedInNavItems = [
    { href: '/(tabs)/home', labelKey: 'nav.home', icon: Home, activeCondition: pathname === '/(tabs)/home' || pathname === '/' },
    { href: '/(tabs)/search', labelKey: 'nav.search', icon: Search, activeCondition: pathname.startsWith('/(tabs)/search') },
    { isAction: true, action: () => openComposer(), labelKey: 'nav.compose', icon: Edit3, activeCondition: false },
    { href: '/(tabs)/notifications', labelKey: 'nav.notifications', icon: Bell, activeCondition: pathname.startsWith('/(tabs)/notifications') },
    { href: '/(tabs)/more', labelKey: 'nav.more', icon: LayoutGrid, activeCondition: pathname.startsWith('/(tabs)/more') || pathname.startsWith('/(tabs)/settings') },
  ];

  const guestNavItems = [
    { href: '/(tabs)/home', labelKey: 'nav.home', icon: Home, activeCondition: pathname === '/(tabs)/home' || pathname === '/' },
    { href: '/(tabs)/search', labelKey: 'nav.search', icon: Search, activeCondition: pathname.startsWith('/(tabs)/search') },
    { isAction: true, action: openLoginModal, labelKey: 'nav.signIn', icon: LogIn, activeCondition: false },
  ];

  const navItems = session ? loggedInNavItems : guestNavItems;

  const renderNavItem = (item: (typeof navItems)[number]) => {
    const isNotifications = item.labelKey === 'nav.notifications';
    const hasNotificationBadge = isNotifications && unreadCount > 0;

    const content = (
      <View style={styles.navItemContainer}>
        <View style={[styles.iconWrapper, item.activeCondition && styles.iconWrapperActive]}>
          <item.icon size={24} color={item.activeCondition ? '#001D35' : '#8A9199'} />
           {hasNotificationBadge && (
             <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
           )}
        </View>
        <Text style={[styles.labelText, item.activeCondition && styles.labelTextActive]}>{t(item.labelKey)}</Text>
      </View>
    );

    if (item.isAction) {
      return (
        <Pressable key={item.labelKey} onPress={item.action} style={styles.navItemPressable}>
          {content}
        </Pressable>
      );
    }
    return (
      <Link key={item.href} href={item.href as any} asChild>
        <Pressable style={styles.navItemPressable}>
            {content}
        </Pressable>
      </Link>
    );
  };
  
  return (
    <>
      {/* Mobile Bottom Bar */}
      <View style={[styles.mobileNav, { display: isHidden || isDesktop ? 'none' : 'flex' }]}>
        {navItems.map(item => <View key={item.labelKey} style={{flex: 1}}>{renderNavItem(item)}</View>)}
      </View>
      
      {/* Desktop Navigation Rail */}
      <View style={[styles.desktopNav, { display: isDesktop ? 'flex' : 'none'}]}>
        <View style={styles.desktopNavSection}>
            {loggedInNavItems.filter(item => item.labelKey !== 'nav.more' && item.labelKey !== 'nav.logout').map(item => renderNavItem(item))}
        </View>
        {session && (
          <View style={styles.desktopNavSection}>
              {renderNavItem(loggedInNavItems.find(i => i.labelKey === 'nav.more')!)}
              <Pressable onPress={logout} style={styles.navItemPressable}>
                  <View style={styles.navItemContainer}>
                      <View style={styles.iconWrapper}>
                          <LogOut size={22} color="#8A9199"/>
                      </View>
                      <Text style={styles.labelText}>{t('nav.logout')}</Text>
                  </View>
              </Pressable>
          </View>
        )}
        {!session && (
          <View style={styles.desktopNavSection}>
             {guestNavItems.filter(item => item.isAction).map(item => renderNavItem(item))}
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  navItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navItemPressable: {
    flex: 1,
  },
  iconWrapper: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  iconWrapperActive: {
    backgroundColor: '#D1E4FF', // primary-container
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C3C6CF', // on-surface-variant
  },
  labelTextActive: {
    color: '#E2E2E6', // on-surface
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#A8C7FA', // primary
    borderRadius: 999,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#003258',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mobileNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E2021', // surface-2
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 50,
  },
  desktopNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 80,
    backgroundColor: '#1E2021',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 24,
    zIndex: 50,
  },
  desktopNavSection: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
});


export default BottomNavbar;
