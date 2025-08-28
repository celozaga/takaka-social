/**
 * ============================================================================
 * Tooltip Integration Examples
 * ============================================================================
 *
 * This file demonstrates how to integrate the centralized tooltip system
 * with existing components in the application.
 *
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Tooltip, TooltipContentKey } from './index';
import FollowButton from '../Button/FollowButton';
import ShareButton from '../Share/ShareButton';
import IconButton from '../Button/IconButton';
import { useTheme } from '../Theme/ThemeProvider';

// ============================================================================
// Example 1: Enhanced FollowButton with Tooltip
// ============================================================================

interface TooltipFollowButtonProps {
  state: 'follow' | 'following' | 'pending';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const TooltipFollowButton: React.FC<TooltipFollowButtonProps> = ({
  state,
  onPress,
  disabled = false,
  loading = false,
  size = 'md',
  showTooltip = true,
}) => {
  const getTooltipKey = (): TooltipContentKey => {
    switch (state) {
      case 'follow':
        return 'profile.follow';
      case 'following':
        return 'profile.unfollow';
      case 'pending':
        return 'profile.follow'; // Could add 'profile.pending' key
      default:
        return 'profile.follow';
    }
  };

  if (!showTooltip) {
    return (
      <FollowButton
        state={state}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
        size={size}
      />
    );
  }

  return (
    <Tooltip
      contentKey={getTooltipKey()}
      position="top"
      disabled={disabled || loading}
    >
      <FollowButton
        state={state}
        onPress={onPress}
        disabled={disabled}
        loading={loading}
        size={size}
      />
    </Tooltip>
  );
};

// ============================================================================
// Example 2: Enhanced ShareButton with Tooltip
// ============================================================================

interface TooltipShareButtonProps {
  content: {
    title?: string;
    text?: string;
    url?: string;
  };
  onShareSuccess?: () => void;
  onShareError?: (error: Error) => void;
  disabled?: boolean;
  showTooltip?: boolean;
}

export const TooltipShareButton: React.FC<TooltipShareButtonProps> = ({
  content,
  onShareSuccess,
  onShareError,
  disabled = false,
  showTooltip = true,
}) => {
  if (!showTooltip) {
    return (
      <ShareButton
        content={content}
        onShareSuccess={onShareSuccess}
        onShareError={onShareError}
        disabled={disabled}
      >
        <Text>📤</Text>
      </ShareButton>
    );
  }

  return (
    <Tooltip
      contentKey="post.share"
      position="top"
      disabled={disabled}
    >
      <ShareButton
        content={content}
        onShareSuccess={onShareSuccess}
        onShareError={onShareError}
        disabled={disabled}
      >
        <Text>📤</Text>
      </ShareButton>
    </Tooltip>
  );
};

// ============================================================================
// Example 3: Action Bar with Multiple Tooltips
// ============================================================================

interface PostActionBarProps {
  onLike: () => void;
  onRepost: () => void;
  onReply: () => void;
  onShare: () => void;
  onBookmark: () => void;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
  showTooltips?: boolean;
}

export const PostActionBar: React.FC<PostActionBarProps> = ({
  onLike,
  onRepost,
  onReply,
  onShare,
  onBookmark,
  isLiked = false,
  isReposted = false,
  isBookmarked = false,
  showTooltips = true,
}) => {
  const { theme } = useTheme();

  const ActionButton: React.FC<{
    onPress: () => void;
    icon: string;
    tooltipKey: TooltipContentKey;
    isActive?: boolean;
  }> = ({ onPress, icon, tooltipKey, isActive = false }) => {
    const button = (
      <IconButton
        onPress={onPress}
        style={[
          styles.actionButton,
          {
            backgroundColor: isActive
              ? theme.colors.primaryContainer
              : 'transparent',
          },
        ]}
      >
        <Text
          style={{
            fontSize: 18,
            color: isActive
              ? theme.colors.primary
              : theme.colors.onSurface,
          }}
        >
          {icon}
        </Text>
      </IconButton>
    );

    if (!showTooltips) {
      return button;
    }

    return (
      <Tooltip contentKey={tooltipKey} position="top">
        {button}
      </Tooltip>
    );
  };

  return (
    <View style={styles.actionBar}>
      <ActionButton
        onPress={onLike}
        icon={isLiked ? '❤️' : '🤍'}
        tooltipKey={isLiked ? 'post.unlike' : 'post.like'}
        isActive={isLiked}
      />
      
      <ActionButton
        onPress={onRepost}
        icon={isReposted ? '🔄' : '↻'}
        tooltipKey={isReposted ? 'post.unrepost' : 'post.repost'}
        isActive={isReposted}
      />
      
      <ActionButton
        onPress={onReply}
        icon="💬"
        tooltipKey="post.reply"
      />
      
      <ActionButton
        onPress={onShare}
        icon="📤"
        tooltipKey="post.share"
      />
      
      <ActionButton
        onPress={onBookmark}
        icon={isBookmarked ? '🔖' : '📑'}
        tooltipKey={isBookmarked ? 'post.unbookmark' : 'post.bookmark'}
        isActive={isBookmarked}
      />
    </View>
  );
};

// ============================================================================
// Example 4: Navigation Bar with Tooltips
// ============================================================================

interface NavBarProps {
  onHome: () => void;
  onSearch: () => void;
  onNotifications: () => void;
  onCompose: () => void;
  onProfile: () => void;
  currentRoute?: string;
  showTooltips?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({
  onHome,
  onSearch,
  onNotifications,
  onCompose,
  onProfile,
  currentRoute,
  showTooltips = true,
}) => {
  const { theme } = useTheme();

  const NavButton: React.FC<{
    onPress: () => void;
    icon: string;
    tooltipKey: TooltipContentKey;
    routeName: string;
  }> = ({ onPress, icon, tooltipKey, routeName }) => {
    const isActive = currentRoute === routeName;
    
    const button = (
      <Pressable
        onPress={onPress}
        style={[
          styles.navButton,
          {
            backgroundColor: isActive
              ? theme.colors.primaryContainer
              : 'transparent',
          },
        ]}
      >
        <Text
          style={{
            fontSize: 24,
            color: isActive
              ? theme.colors.primary
              : theme.colors.onSurface,
          }}
        >
          {icon}
        </Text>
      </Pressable>
    );

    if (!showTooltips) {
      return button;
    }

    return (
      <Tooltip contentKey={tooltipKey} position="top">
        {button}
      </Tooltip>
    );
  };

  return (
    <View style={[styles.navBar, { backgroundColor: theme.colors.surface }]}>
      <NavButton
        onPress={onHome}
        icon="🏠"
        tooltipKey="nav.home"
        routeName="home"
      />
      
      <NavButton
        onPress={onSearch}
        icon="🔍"
        tooltipKey="nav.search"
        routeName="search"
      />
      
      <NavButton
        onPress={onCompose}
        icon="✏️"
        tooltipKey="nav.compose"
        routeName="compose"
      />
      
      <NavButton
        onPress={onNotifications}
        icon="🔔"
        tooltipKey="nav.notifications"
        routeName="notifications"
      />
      
      <NavButton
        onPress={onProfile}
        icon="👤"
        tooltipKey="nav.profile"
        routeName="profile"
      />
    </View>
  );
};

// ============================================================================
// Example 5: Settings Panel with Tooltips
// ============================================================================

interface SettingsPanelProps {
  onThemeChange: () => void;
  onLanguageChange: () => void;
  onNotificationSettings: () => void;
  onPrivacySettings: () => void;
  showTooltips?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onThemeChange,
  onLanguageChange,
  onNotificationSettings,
  onPrivacySettings,
  showTooltips = true,
}) => {
  const { theme } = useTheme();

  const SettingItem: React.FC<{
    onPress: () => void;
    icon: string;
    label: string;
    tooltipKey: TooltipContentKey;
  }> = ({ onPress, icon, label, tooltipKey }) => {
    const item = (
      <Pressable
        onPress={onPress}
        style={[
          styles.settingItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        <Text
          style={{
            marginLeft: theme.spacing.sm,
            color: theme.colors.onSurface,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );

    if (!showTooltips) {
      return item;
    }

    return (
      <Tooltip contentKey={tooltipKey} position="right">
        {item}
      </Tooltip>
    );
  };

  return (
    <View style={styles.settingsPanel}>
      <SettingItem
        onPress={onThemeChange}
        icon="🎨"
        label="Theme"
        tooltipKey="settings.theme"
      />
      
      <SettingItem
        onPress={onLanguageChange}
        icon="🌐"
        label="Language"
        tooltipKey="settings.language"
      />
      
      <SettingItem
        onPress={onNotificationSettings}
        icon="🔔"
        label="Notifications"
        tooltipKey="settings.notifications"
      />
      
      <SettingItem
        onPress={onPrivacySettings}
        icon="🔒"
        label="Privacy"
        tooltipKey="settings.privacy"
      />
    </View>
  );
};

// ============================================================================
// Combined Demo Component
// ============================================================================

export const TooltipIntegrationDemo: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.demo,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: theme.colors.onBackground },
        ]}
      >
        Tooltip Integration Examples
      </Text>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.onBackground },
          ]}
        >
          Enhanced Buttons
        </Text>
        
        <View style={styles.buttonRow}>
          <TooltipFollowButton
            state="follow"
            onPress={() => console.log('Follow pressed')}
          />
          
          <TooltipShareButton
            content={{
              title: 'Check this out!',
              text: 'Amazing content',
              url: 'https://example.com',
            }}
            onShareSuccess={() => console.log('Shared!')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.onBackground },
          ]}
        >
          Post Actions
        </Text>
        
        <PostActionBar
          onLike={() => console.log('Like')}
          onRepost={() => console.log('Repost')}
          onReply={() => console.log('Reply')}
          onShare={() => console.log('Share')}
          onBookmark={() => console.log('Bookmark')}
        />
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.onBackground },
          ]}
        >
          Navigation
        </Text>
        
        <NavBar
          onHome={() => console.log('Home')}
          onSearch={() => console.log('Search')}
          onNotifications={() => console.log('Notifications')}
          onCompose={() => console.log('Compose')}
          onProfile={() => console.log('Profile')}
          currentRoute="home"
        />
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.onBackground },
          ]}
        >
          Settings
        </Text>
        
        <SettingsPanel
          onThemeChange={() => console.log('Theme')}
          onLanguageChange={() => console.log('Language')}
          onNotificationSettings={() => console.log('Notifications')}
          onPrivacySettings={() => console.log('Privacy')}
        />
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  demo: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    minWidth: 40,
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 12,
  },
  navButton: {
    padding: 12,
    borderRadius: 24,
    minWidth: 48,
    alignItems: 'center',
  },
  settingsPanel: {
    gap: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});

export default TooltipIntegrationDemo;