import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, usePathname } from 'expo-router';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { Home, Search, Edit3, LogOut, Bell, LogIn, LayoutGrid, Settings } from 'lucide-react';
import { View, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import theme from '@/lib/theme';

const NavItem: React.FC<{
  item: any;
  isDesktop: boolean;
}> = ({ item, isDesktop }) => {
  const { t } = useTranslation();
  const { unreadCount } = useAtp();

  const isNotifications = item.labelKey === 'nav.notifications';
  const hasNotificationBadge = isNotifications && unreadCount > 0;

  const content = (
    <>
      <View style={[styles.iconContainer, item.activeCondition && styles.iconContainerActive]}>
        <item.icon size={24} color={item.activeCondition ? theme.colors.primary : theme.colors.onSurfaceVariant} />
        {hasNotificationBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.labelText, item.activeCondition && styles.labelTextActive]}>{t(item.labelKey)}</Text>
    </>
  );

  const style = [
    styles.navItemBase,
    isDesktop ? styles.navItemDesktop : styles.navItemMobile,
  ];

  if (item.isAction) {
    return (
      <Pressable onPress={item.action} style={({ pressed }) => [style, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return (
    <Link href={item.href as any} asChild>
      <Pressable style={({ pressed }) => [style, pressed && styles.pressed]}>
        {content}
      </Pressable>
    </Link>
  );
};

const BottomNavbar: React.FC = () => {
  const { session, logout } = useAtp();
  const { openLoginModal, openComposer } = useUI();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const navItems = [
    { href: '/home', labelKey: 'nav.home', icon: Home, activeCondition: pathname === '/home' || pathname === '/' },
    { href: '/search', labelKey: 'nav.search', icon: Search, activeCondition: pathname.startsWith('/search') },
    ...(session ? [
      { isAction: true, action: () => openComposer(), labelKey: 'nav.compose', icon: Edit3, activeCondition: false },
      { href: '/notifications', labelKey: 'nav.notifications', icon: Bell, activeCondition: pathname.startsWith('/notifications') },
      { href: '/settings', labelKey: 'nav.settings', icon: Settings, activeCondition: pathname.startsWith('/settings') || pathname.startsWith('/more') },
    ] : [
      { isAction: true, action: openLoginModal, labelKey: 'nav.signIn', icon: LogIn, activeCondition: false },
    ]),
  ];

  if (isDesktop) {
    return (
      <View style={styles.navRail}>
        <View style={styles.navRailSection}>
          {navItems.filter(item => !item.isAction || item.labelKey === 'nav.compose').map(item => <NavItem key={item.labelKey} item={item} isDesktop />)}
        </View>
        <View style={styles.navRailSection}>
          {session ? (
            <Pressable onPress={logout} style={({ pressed }) => [styles.navItemBase, styles.navItemDesktop, pressed && styles.pressed]}>
              <View style={styles.iconContainer}><LogOut size={24} color={theme.colors.onSurfaceVariant} /></View>
              <Text style={styles.labelText}>{t('nav.logout')}</Text>
            </Pressable>
          ) : (
             navItems.filter(item => item.isAction && item.labelKey !== 'nav.compose').map(item => <NavItem key={item.labelKey} item={item} isDesktop />)
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.navBar}>
      {navItems.map(item => <NavItem key={item.labelKey} item={item} isDesktop={false} />)}
    </View>
  );
};

const styles = StyleSheet.create({
  // Mobile Navigation Bar
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: theme.colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 50,
  },
  // Desktop Navigation Rail
  navRail: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 80,
    backgroundColor: theme.colors.surface,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.l,
    zIndex: 50,
  },
  navRailSection: {
    alignItems: 'center',
    gap: theme.spacing.m,
    width: '100%',
  },
  // Common Nav Item styles
  navItemBase: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.shape.full,
  },
  navItemMobile: {
    flex: 1,
    height: '100%',
  },
  navItemDesktop: {
    width: 64,
    height: 56,
  },
  pressed: {
    backgroundColor: 'rgba(255,255,255,0.1)'
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
    backgroundColor: theme.colors.surfaceContainerHighest,
  },
  labelText: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurfaceVariant,
  },
  labelTextActive: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.shape.full,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    ...theme.typography.labelSmall,
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
  },
});

export default BottomNavbar;