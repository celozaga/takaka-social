import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, usePathname } from 'expo-router';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { Home, Search, Edit3, LogOut, Bell, LogIn, Settings } from 'lucide-react';
import { View, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';

// NavItem component for a single navigation item.
const NavItem = ({ item, isDesktop }: { item: any; isDesktop: boolean; }) => {
  const { t } = useTranslation();
  const { unreadCount } = useAtp();

  const isNotifications = item.labelKey === 'nav.notifications';
  const hasNotificationBadge = isNotifications && unreadCount > 0;

  // The content (Icon and Text) of the navigation item.
  // This is shared between Pressable and Link.
  const content = (
    <View style={isDesktop ? styles.navRailItemContent : styles.navBarItemContent}>
      <View style={[styles.iconContainer, item.activeCondition && styles.iconContainerActive]}>
        <item.icon size={24} color={item.activeCondition ? theme.colors.onSurface : theme.colors.onSurfaceVariant} />
        {hasNotificationBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.labelText, item.activeCondition && styles.labelTextActive]} numberOfLines={1}>
        {t(item.labelKey)}
      </Text>
    </View>
  );

  const style = ({ pressed }) => [
    isDesktop ? styles.navRailItem : styles.navBarItem,
    pressed && styles.pressed,
  ];

  if (item.isAction) {
    return (
      <Pressable onPress={item.action} style={style}>
        {content}
      </Pressable>
    );
  }

  return (
    <Link href={item.href} asChild>
      <Pressable style={style}>
        {content}
      </Pressable>
    </Link>
  );
};

// Main Navbar component that handles responsive layout.
const BottomNavbar = () => {
  const { session, logout } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const isDesktop = width >= 768;

  // Define navigation items based on login state
  const navItems = [
    { href: '/home', labelKey: 'nav.home', icon: Home, activeCondition: pathname === '/home' || pathname === '/' },
    { href: '/search', labelKey: 'nav.search', icon: Search, activeCondition: pathname.startsWith('/search') },
    ...(session
      ? [
          { isAction: true, action: () => openComposer(), labelKey: 'nav.compose', icon: Edit3, activeCondition: false },
          { href: '/notifications', labelKey: 'nav.notifications', icon: Bell, activeCondition: pathname.startsWith('/notifications') },
          { href: '/settings', labelKey: 'nav.settings', icon: Settings, activeCondition: pathname.startsWith('/settings') || pathname.startsWith('/more') },
        ]
      : [{ isAction: true, action: openLoginModal, labelKey: 'nav.signIn', icon: LogIn, activeCondition: false }]),
  ];

  // Render Navigation Rail for larger screens
  if (isDesktop) {
    const desktopNavItems = navItems.filter(item => !(item.isAction && item.labelKey === 'nav.compose'));

    return (
      <View style={[styles.navRail, { paddingTop: top + theme.spacing.l, paddingBottom: bottom + theme.spacing.l }]}>
        <View style={styles.navRailSection}>
          {desktopNavItems.map(item => <NavItem key={item.labelKey} item={item} isDesktop />)}
        </View>
        <View style={styles.navRailSection}>
          {session ? (
            <>
              <NavItem item={{ isAction: true, action: () => openComposer(), labelKey: 'nav.compose', icon: Edit3, activeCondition: false }} isDesktop />
              <NavItem item={{ isAction: true, action: logout, labelKey: 'nav.logout', icon: LogOut, activeCondition: false }} isDesktop />
            </>
          ) : null }
        </View>
      </View>
    );
  }

  // Render Bottom Navigation Bar for smaller screens
  return (
    <View style={[styles.navBar, { height: 80 + bottom, paddingBottom: bottom }]}>
      {navItems.map(item => (
        <NavItem key={item.labelKey} item={item} isDesktop={false} />
      ))}
    </View>
  );
};


// Styles rewritten for clarity and to fix alignment issues.
const styles = StyleSheet.create({
  // Common
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.shape.full,
    position: 'relative',
  },
  iconContainerActive: {
    backgroundColor: 'transparent',
  },
  labelText: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '400',
    textAlign: 'center',
    // Add padding to prevent text from touching edges on small screens
    paddingHorizontal: 2,
  },
  labelTextActive: {
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 12,
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
    backgroundColor: theme.colors.background,
    borderTopWidth: 0,
    zIndex: 50,
  },
  navBarItem: {
    flex: 1, // Each item takes equal width
    height: '100%',
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'center',
    paddingTop: theme.spacing.m, // 12px padding top per M3 spec
  },
  navBarItemContent: {
    // This view ensures icon and text are stacked vertically
    alignItems: 'center',
    gap: theme.spacing.xs, // 4px gap between icon and label
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
});

export default BottomNavbar;