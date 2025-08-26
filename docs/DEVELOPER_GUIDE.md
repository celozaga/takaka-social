# Developer Guide - Universal UI Kit & Design System

This guide explains how to use the universal UI kit and design system implemented for this cross-platform Bluesky client.

## Table of Contents

- [Overview](#overview)
- [Theme System](#theme-system)
- [Design Tokens](#design-tokens)
- [Shared Components](#shared-components)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

## Overview

The design system provides a consistent, scalable foundation for building UI components across web, iOS, and Android platforms. It's built on top of Expo SDK 53 and React Native Web.

### Key Principles

- **Universal First**: Components work across all platforms without modification
- **Expo-First**: Prefer Expo modules over raw React Native APIs
- **Token-Based**: All styling uses design tokens for consistency
- **TypeScript**: Full type safety throughout the system
- **Accessible**: Built-in accessibility features for all components

## Theme System

### Using the Theme Provider

Wrap your app with `ThemeProvider` to enable theme support:

```tsx
// App.tsx
import { ThemeProvider } from '@/components/shared';

export default function App() {
  return (
    <ThemeProvider defaultColorScheme="dark">
      <YourApp />
    </ThemeProvider>
  );
}
```

### Using the useTheme Hook

Access theme tokens in any component:

```tsx
import { useTheme } from '@/components/shared';

function MyComponent() {
  const { theme, colorScheme, isDark, toggleTheme } = useTheme();
  
  return (
    <View style={{
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
    }}>
      <Text style={{
        color: theme.colors.onBackground,
        ...theme.typography.bodyLarge,
      }}>
        Current theme: {colorScheme}
      </Text>
    </View>
  );
}
```

### Utility Hooks

For convenience, use specialized hooks:

```tsx
import { useThemeColors, useThemedStyles } from '@/components/shared';

// Get colors directly
const colors = useThemeColors();

// Create themed styles
const styles = useThemedStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
}));
```

## Design Tokens

All design tokens are defined in `src/design/tokens.ts`. Here's what's available:

### Colors

```tsx
// Semantic colors
theme.colors.primary
theme.colors.secondary
theme.colors.background
theme.colors.surface
theme.colors.error
theme.colors.warning
theme.colors.success
theme.colors.info

// Interactive states
theme.colors.hover
theme.colors.pressed
theme.colors.disabled
```

### Spacing

```tsx
theme.spacing.xs    // 4px
theme.spacing.sm    // 8px
theme.spacing.md    // 12px
theme.spacing.lg    // 16px
theme.spacing.xl    // 20px
theme.spacing['2xl'] // 24px
theme.spacing['3xl'] // 32px
```

### Typography

```tsx
theme.typography.displayLarge
theme.typography.headlineMedium
theme.typography.titleLarge
theme.typography.bodyMedium
theme.typography.labelSmall
```

### Border Radius

```tsx
theme.radius.sm     // 4px
theme.radius.md     // 8px
theme.radius.lg     // 12px
theme.radius.xl     // 16px
theme.radius.full   // 9999px
```

### Shadows & Elevations

```tsx
theme.shadows.sm    // Light shadow
theme.shadows.md    // Medium shadow
theme.shadows.lg    // Heavy shadow
```

### Sizes

```tsx
// Icons
theme.sizes.iconSm  // 16px
theme.sizes.iconMd  // 20px
theme.sizes.iconLg  // 24px

// Avatars
theme.sizes.avatarSm // 32px
theme.sizes.avatarMd // 40px
theme.sizes.avatarLg // 48px

// Buttons & Inputs
theme.sizes.buttonMd // 40px
theme.sizes.inputMd  // 40px
```

## Shared Components

Components are organized in folders under `components/shared/`:

### Theme Components
- `ThemeProvider` - Theme context provider

### Avatar Components
- `Avatar` - User avatar with fallback
- `AvatarOverlayFollow` - Avatar with follow button overlay

### Button Components  
- `PrimaryButton` - Primary action button
- `SecondaryButton` - Secondary action button
- `IconButton` - Icon-only button
- `FollowButton` - Follow/unfollow button
- `BackButton` - Navigation back button

### Card Components
- `Card` - Container with elevation and variants

### Form Components
- `Input` - Text input with validation states

### Layout Components
- `Container` - Responsive container with padding

### Modal Components
- `Modal` - Overlay modal with backdrop

### Typography Components
- `Typography` - Text component with semantic variants

### And more...

### Basic Component Usage

```tsx
import {
  Avatar,
  Card,
  Typography,
  PrimaryButton,
  Input,
  useTheme
} from '@/components/shared';

function ProfileCard({ user }) {
  const { theme } = useTheme();
  
  return (
    <Card variant="elevated" padding="lg">
      <Avatar 
        uri={user.avatar} 
        size="lg" 
        fallback={user.initials} 
      />
      
      <Typography variant="titleMedium" align="center">
        {user.name}
      </Typography>
      
      <Typography variant="bodyMedium" color="onSurfaceVariant">
        {user.bio}
      </Typography>
      
      <PrimaryButton
        title="Follow"
        onPress={handleFollow}
        style={{ marginTop: theme.spacing.md }}
      />
    </Card>
  );
}
```

### Advanced Component Usage

#### Custom Styled Components

```tsx
import { useThemedStyles } from '@/components/shared';

const CustomComponent = () => {
  const styles = useThemedStyles((theme) => ({
    container: {
      backgroundColor: theme.colors.surfaceContainer,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      ...theme.shadows.md,
    },
    title: {
      ...theme.typography.headlineSmall,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
    },
  }));
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custom Component</Text>
    </View>
  );
};
```

#### Platform-Specific Handling

Some components handle platform differences automatically:

```tsx
// ShareButton uses expo-sharing on native, Web Share API on web
<ShareButton
  content={{
    title: "Check this out!",
    text: "Amazing content",
    url: "https://example.com"
  }}
  onShareSuccess={() => console.log('Shared!')}
>
  <ShareIcon />
</ShareButton>

// FollowButton provides haptic feedback on native platforms
<FollowButton
  state="follow"
  onPress={handleFollow}
  size="md"
/>
```

## Best Practices

### Do's

✅ **Use design tokens** instead of hardcoded values:
```tsx
// Good
padding: theme.spacing.md

// Bad  
padding: 12
```

✅ **Prefer Expo modules** when available:
```tsx
// Good
import { Image } from 'expo-image';

// Only when Expo doesn't have an alternative
import { Image } from 'react-native';
```

✅ **Use semantic color tokens**:
```tsx
// Good
color: theme.colors.onSurface

// Bad
color: '#FFFFFF'
```

✅ **Include accessibility props**:
```tsx
<PrimaryButton
  title="Submit"
  onPress={handleSubmit}
  accessibilityLabel="Submit form"
  testID="submit-button"
/>
```

### Don'ts

❌ **Don't bypass the theme system**:
```tsx
// Bad
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF', // Hardcoded color
    padding: 16, // Hardcoded spacing
  }
});
```

❌ **Don't create platform-specific files unless necessary**:
```tsx
// Only create .native.tsx or .web.tsx when absolutely required
// Most components should work universally
```

❌ **Don't import from internal paths**:
```tsx
// Bad
import { useTheme } from '../shared/Theme/ThemeProvider';

// Good
import { useTheme } from '@/components/shared';
```

### Component Architecture

When creating new shared components:

1. **Start with the component folder structure**:
```
components/shared/NewComponent/
├── index.ts
├── NewComponent.tsx
└── README.md (optional)
```

2. **Follow the component template**:
```tsx
/**
 * ============================================================================
 * NewComponent
 * ============================================================================
 *
 * Brief description of what this component does.
 * Mention any special platform considerations.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

interface NewComponentProps {
  /** Prop description */
  propName?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const NewComponent: React.FC<NewComponentProps> = ({
  propName,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface }
      ]}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {/* Component content */}
    </View>
  );
};

// ============================================================================
// Styles  
// ============================================================================

const styles = StyleSheet.create({
  container: {
    // Only put theme-independent styles here
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NewComponent;
```

3. **Export from the folder's index.ts**:
```tsx
// components/shared/NewComponent/index.ts
export { default as NewComponent } from './NewComponent';
```

4. **Add to main shared/index.ts**:
```tsx
// components/shared/index.ts
export * from './NewComponent';
```

### Theme Customization

To add new tokens or modify existing ones:

1. **Update `src/design/tokens.ts`**:
```tsx
export const spacing = {
  // ... existing values
  '4xl': 48, // New spacing value
} as const;
```

2. **The change automatically propagates** to all components using the theme system.

3. **Maintain backward compatibility** when possible by keeping existing token names.

## Migration Guide

### Migration Status

**✅ COMPLETED MIGRATIONS:**

#### Shared Components (100% Complete)
- ✅ **Button Components**: `SecondaryButton`, `IconButton`, `BackButton`
- ✅ **Skeleton Components**: `PostCardSkeleton`, `SkeletonLine`, `SkeletonAvatar`
- ✅ **Loading Components**: `LoadingSpinner`, `LoadingState`
- ✅ **Header Components**: `BackHeader`

#### Core Components (In Progress)
- ✅ **Composer**: Complete migration with `useTheme()` and `createStyles()`
- ✅ **LoginScreen**: Complete migration with `useTheme()` and `createStyles()`
- ✅ **FeedAvatar**: Complete migration with `useTheme()` and `createStyles()`
- ✅ **FeedsScreen**: Complete migration with `useTheme()` and `createStyles()`
- ✅ **PostActions**: Complete migration with `useTheme()` and `createStyles()`
- ✅ **PostHeader**: Complete migration with `useTheme()` and `createStyles()`

#### Remaining Components to Migrate
- 🔄 **Feed Components**: `FeedHeaderModal`, `FeedSearchResultCard`, `FeedViewHeader`, `FeedViewScreen`
- 🔄 **Post Components**: `FullPostCard`, `FullPostCardSkeleton`, `PostScreen`, `PostScreenActionBar`, `QuotedPost`, `Reply`
- 🔄 **Search Components**: `SearchScreen`, `ActorSearchResultCard`, `TrendingTopics`
- 🔄 **Settings Components**: All settings screens
- 🔄 **Watch Components**: All video-related components
- 🔄 **Profile Components**: All profile-related components
- 🔄 **Notification Components**: All notification components
- 🔄 **More Components**: `MoreScreen` and related components

### Migration Pattern

All components follow this migration pattern:

1. **Import Change**:
```tsx
// OLD
import { theme } from '@/lib/theme';

// NEW
import { useTheme } from '@/components/shared';
```

2. **Component Update**:
```tsx
const MyComponent = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};
```

3. **Styles Migration**:
```tsx
// OLD
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceContainer,
    padding: theme.spacing.m,
    borderRadius: theme.shape.large,
  },
});

// NEW
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceContainer,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
});
```

### Token Mapping

**Spacing Tokens**:
- `theme.spacing.s` → `theme.spacing.sm`
- `theme.spacing.m` → `theme.spacing.md`
- `theme.spacing.l` → `theme.spacing.lg`

**Radius Tokens**:
- `theme.shape.small` → `theme.radius.sm`
- `theme.shape.medium` → `theme.radius.md`
- `theme.shape.large` → `theme.radius.lg`
- `theme.shape.full` → `theme.radius.full`

**Typography Tokens**:
- `...theme.typography.bodyMedium` → `fontSize: theme.typography.bodyMedium.fontSize`
- `...theme.typography.titleLarge` → `fontSize: theme.typography.titleLarge.fontSize`

### From Legacy Theme System

If you have existing components using the old `lib/theme.ts`:

1. **Update imports**:
```tsx
// Old
import { theme } from '@/lib/theme';

// New
import { useTheme } from '@/components/shared';
const { theme } = useTheme();
```

2. **Replace static styles with dynamic ones**:
```tsx
// Old
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
  }
});

// New
const Component = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{
      backgroundColor: theme.colors.background,
    }}>
      {/* Content */}
    </View>
  );
};
```

### Adding New Design Tokens

1. Add to the appropriate section in `src/design/tokens.ts`
2. Update type definitions if needed
3. Document the new token in this guide
4. Use in components consistently

### Performance Considerations

- Theme context re-renders are minimized through React.useMemo
- Design tokens are static objects (no runtime computation)
- Platform-specific code is tree-shaken automatically
- Expo modules are optimized for performance

## Troubleshooting

### Common Issues

**TypeScript errors about theme properties:**
- Ensure you're importing from the correct path
- Check that the token exists in `src/design/tokens.ts`
- Verify the component is wrapped in `ThemeProvider`

**Styles not updating when theme changes:**
- Make sure you're using the `useTheme` hook, not importing static theme
- Check that styles are applied inside the component function, not in StyleSheet.create

**Platform-specific issues:**
- Check if the issue is related to Expo modules vs React Native APIs
- Verify platform-specific imports are handled correctly
- Test on the specific platform where issues occur

### Getting Help

1. Check this documentation first
2. Look at existing component implementations for patterns
3. Check the TypeScript types for available props and methods
4. Test changes across all target platforms

---

**Happy coding! 🚀**

This design system is built to grow with the app. When you need new components or tokens, follow the established patterns and maintain consistency across the codebase.
