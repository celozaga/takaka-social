import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, usePathname } from 'expo-router';
import { useAtp } from '../../context/AtpContext';
import { useUI } from '../../context/UIContext';
import { Home, Search, Edit3, LogOut, Bell, LogIn, Settings } from 'lucide-react';
import { View, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';

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
        <item.icon size={24} color={item.activeCondition ? theme.colors.onSurface : theme.colors.onSurfaceVariant} />
        {hasNotificationBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.labelText, item.activeCondition && styles.labelTextActive]} numberOfLines={1}>{t(item.labelKey)}</Text>
    </>
  );

  const style = ({ pressed }: { pressed: boolean }) => [
    styles.navItem,
    isDesktop ? styles.navItemDesktop : { height: 80 },
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
    <Link href={item.href as any} asChild>
      <Pressable style={style}>
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
  const { top, bottom } = useSafeAreaInsets();
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
    const desktopNavItems = [
      { href: '/home', labelKey: 'nav.home', icon: Home, activeCondition: pathname === '/home' || pathname === '/' },
      { href: '/search', labelKey: 'nav.search', icon: Search, activeCondition: pathname.startsWith('/search') },
      ...(session ? [
        { href: '/notifications', labelKey: 'nav.notifications', icon: Bell, activeCondition: pathname.startsWith('/notifications') },
        { href: '/settings', labelKey: 'nav.settings', icon: Settings, activeCondition: pathname.startsWith('/settings') || pathname.startsWith('/more') },
      ] : []),
    ];
    return (
      <View style={[styles.navRail, { paddingTop: top + theme.spacing.l, paddingBottom: bottom + theme.spacing.l }]}>
        <View style={styles.navRailSection}>
          {desktopNavItems.map(item => <NavItem key={item.labelKey} item={item} isDesktop />)}
        </View>
        <View style={styles.navRailSection}>
          {session ? (
            <>
              <Pressable onPress={() => openComposer()} style={({pressed}) => [styles.navItem, styles.navItemDesktop, pressed && styles.pressed]}>
                  <View style={styles.iconContainer}><Edit3 size={24} color={theme.colors.onSurfaceVariant} /></View>
                  <Text style={styles.labelText}>{t('nav.compose')}</Text>
              </Pressable>
              <Pressable onPress={logout} style={({ pressed }) => [styles.navItem, styles.navItemDesktop, pressed && styles.pressed]}>
                <View style={styles.iconContainer}><LogOut size={24} color={theme.colors.onSurfaceVariant} /></View>
                <Text style={styles.labelText}>{t('nav.logout')}</Text>
              </Pressable>
            </>
          ) : (
             <NavItem item={{ isAction: true, action: openLoginModal, labelKey: 'nav.signIn', icon: LogIn, activeCondition: false }} isDesktop />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.navBar, { height: 80 + bottom, paddingBottom: bottom }]}>
      {navItems.map(item => <NavItem key={item.labelKey} item={item} isDesktop={false} />)}
    </View>
  );
};

const styles = StyleSheet.create({
  // Mobile Nav Bar: 80px height, fixed to bottom, respects safe area
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainer,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceContainerHigh,
    zIndex: 50,
  },
  // Each item in the mobile nav bar
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: theme.spacing.m, // 12px padding top per M3 spec
    gap: theme.spacing.xs, // 4px gap between icon and label
  },
  // The pill-shaped indicator for the active icon
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
  // Text label styles
  labelText: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '400',
  },
  labelTextActive: {
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  // Notification badge
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
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Desktop Nav Rail (unchanged from previous state)
  navRail: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 80,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  navRailSection: {
    alignItems: 'center',
    gap: theme.spacing.m,
    width: '100%',
  },
  navItemDesktop: {
    flex: 0,
    width: '100%',
    height: 72,
    paddingTop: 0,
  },
});

export default BottomNavbar;