


import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, usePathname } from 'expo-router';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { Home, Search, Plus, Bell, LogOut, LogIn, LayoutGrid } from 'lucide-react';
import { View, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';

const NavItem: React.FC<{ item: any; isDesktop: boolean; }> = ({ item, isDesktop }) => {
  const { t } = useTranslation();
  const { unreadCount } = useAtp();
  
  const isNotifications = item.labelKey === 'nav.notifications';
  const hasNotificationBadge = isNotifications && unreadCount > 0;

  const content = (
    <View style={isDesktop ? styles.navRailItemContent : styles.navBarItemContent}>
      <View style={styles.iconWrapper}>
        <item.icon
          size={24}
          color={item.activeCondition ? theme.colors.onSurface : theme.colors.onSurfaceVariant}
          fill={item.activeCondition ? theme.colors.onSurface : 'none'}
          strokeWidth={2}
        />
        {hasNotificationBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </View>
      {isDesktop && (
        <Text style={[styles.labelText, item.activeCondition && styles.labelTextActive]} numberOfLines={1}>
          {t(item.labelKey)}
        </Text>
      )}
    </View>
  );

  const style = ({ pressed }: { pressed: boolean }) => [
    isDesktop ? styles.navRailItem : styles.navBarItem,
    pressed && styles.pressed,
  ];

  return (
    <Link href={item.href as any} asChild>
      <Pressable
        style={style}
        onPress={(e) => {
          if (item.isAction) {
            e.preventDefault();
            item.action();
          }
        }}
      >
        {content}
      </Pressable>
    </Link>
  );
};

const BottomNavbar = () => {
  const { session, logout } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const isDesktop = width >= 768;

  const navItems = [
    { href: '/home', labelKey: 'nav.home', icon: Home, activeCondition: pathname === '/home' || pathname === '/' },
    { href: '/search', labelKey: 'nav.search', icon: Search, activeCondition: pathname.startsWith('/search') },
    ...(session
      ? [
          { isAction: true, action: () => openComposer(), labelKey: 'nav.compose', icon: Plus, activeCondition: false, href: '#' },
          { href: '/notifications', labelKey: 'nav.notifications', icon: Bell, activeCondition: pathname.startsWith('/notifications') },
          { href: '/more', labelKey: 'nav.more', icon: LayoutGrid, activeCondition: pathname.startsWith('/settings') || pathname.startsWith('/more') },
        ]
      : [{ isAction: true, action: openLoginModal, labelKey: 'nav.signIn', icon: LogIn, activeCondition: false, href: '#' }]),
  ];

  // Render Navigation Rail for larger screens
  if (isDesktop) {
    const desktopNavItems = navItems.filter(item => !(item.isAction && item.labelKey === 'nav.compose'));
    const composeItem = { isAction: true, action: () => openComposer(), labelKey: 'nav.compose', icon: Plus, activeCondition: false, href: '#' };
    const logoutItem = { isAction: true, action: logout, labelKey: 'nav.logout', icon: LogOut, activeCondition: false, href: '#' };
    
    return (
      <View style={[styles.navRail, { paddingTop: top + theme.spacing.l, paddingBottom: bottom + theme.spacing.l }]}>
        <View style={styles.navRailSection}>
          {desktopNavItems.map(item => <NavItem key={item.labelKey} item={item} isDesktop />)}
        </View>
        <View style={styles.navRailSection}>
          {session ? (
            <>
              <NavItem item={composeItem} isDesktop />
              <NavItem item={logoutItem} isDesktop />
            </>
          ) : null}
        </View>
      </View>
    );
  }

  // Render Bottom Navigation Bar for smaller screens
  return (
    <View style={[styles.navBar, { height: 60 + bottom, paddingBottom: bottom }]}>
      {navItems.map(item => <NavItem key={item.labelKey} item={item} isDesktop={false} />)}
    </View>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  labelText: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  labelTextActive: {
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: theme.shape.full,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceContainer,
  },
  badgeText: {
    ...theme.typography.labelSmall,
    color: 'white',
    fontWeight: 'bold',
  },

  // Mobile: Bottom Navigation Bar
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.background,
    borderTopWidth: 0,
    zIndex: 50,
  },
  navBarItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBarItemContent: {
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Desktop: Navigation Rail
  navRail: {
    width: 80,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  navRailSection: {
    alignItems: 'center',
    gap: theme.spacing.m,
    width: '100%',
  },
  navRailItem: {
    width: '100%',
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRailItemContent: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  iconContainer: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shape.full,
    position: 'relative',
  },
});

export default BottomNavbar;