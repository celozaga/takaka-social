# Tooltip System

A centralized, accessible, and customizable tooltip system for the Takaka Social application with responsive design capabilities.

## Overview

This tooltip system provides:
- **Centralized content management** - All tooltip texts in one place
- **Internationalization support** - Works with react-i18next
- **Accessibility features** - Screen reader support and proper ARIA attributes
- **Cross-platform compatibility** - Works on web, iOS, and Android
- **Responsive design** - Adapts to different screen sizes (mobile, tablet, desktop)
- **Customizable styling** - Integrates with the app's design system
- **Multiple positioning options** - Auto-positioning with fallbacks
- **Smart sizing** - Automatically adjusts size based on content and screen dimensions

## Quick Start

### Basic Usage

```tsx
import { Tooltip } from '@/components/shared';

// Using predefined content
<Tooltip contentKey="post.like" position="top">
  <Button>Like</Button>
</Tooltip>

// Using custom content
<Tooltip content="Custom help text" position="bottom">
  <Icon name="help" />
</Tooltip>
```

### Advanced Usage with Hook

```tsx
import { useTooltip } from '@/components/shared';

const MyComponent = () => {
  const { isVisible, show, hide, triggerProps } = useTooltip({
    showDelay: 500,
    hideDelay: 100,
  });
  
  return (
    <Pressable {...triggerProps}>
      <Text>Hover or press me</Text>
    </Pressable>
  );
};
```

## Components

### `<Tooltip>`

The main tooltip component that wraps around trigger elements.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `contentKey` | `TooltipContentKey` | - | Predefined content key |
| `content` | `string` | - | Custom content (overrides contentKey) |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` | `'auto'` | Tooltip position |
| `variant` | `'default' \| 'info' \| 'warning' \| 'error' \| 'success'` | `'default'` | Visual variant |
| `visible` | `boolean` | - | Force visibility (controlled mode) |
| `disabled` | `boolean` | `false` | Disable tooltip |
| `showDelay` | `number` | `500` | Delay before showing (ms) |
| `hideDelay` | `number` | `0` | Delay before hiding (ms) |
| `offset` | `number` | `8` | Distance from trigger |
| `maxWidth` | `number` | `250` | Maximum tooltip width (responsive) |
| `style` | `ViewStyle` | - | Custom container styles |
| `textStyle` | `TextStyle` | - | Custom text styles |
| `children` | `ReactNode` | - | Trigger element |

### `useTooltip` Hook

Provides programmatic control over tooltip state.

#### Parameters

```tsx
interface UseTooltipOptions {
  showDelay?: number;     // Delay before showing (ms)
  hideDelay?: number;     // Delay before hiding (ms)
  disabled?: boolean;     // Whether tooltip is disabled
}
```

#### Returns

```tsx
interface UseTooltipReturn {
  isVisible: boolean;     // Current visibility state
  show: () => void;       // Show tooltip
  hide: () => void;       // Hide tooltip
  toggle: () => void;     // Toggle visibility
  triggerProps: {         // Props for trigger element
    onPressIn?: () => void;
    onPressOut?: () => void;
    onHoverIn?: () => void;
    onHoverOut?: () => void;
  };
}
```

## Content Management

### Predefined Content Keys

The system includes predefined content for common UI elements:

```tsx
// Navigation
'nav.home' | 'nav.search' | 'nav.notifications' | 'nav.compose'

// Post Actions
'post.like' | 'post.unlike' | 'post.repost' | 'post.reply'

// Profile Actions
'profile.follow' | 'profile.unfollow' | 'profile.block'

// Settings
'settings.theme' | 'settings.language' | 'settings.privacy' | 'settings.help'

// Forms
'form.required' | 'form.optional' | 'form.password.show'

// Media
'media.play' | 'media.pause' | 'media.mute'

// General
'general.close' | 'general.back' | 'general.refresh'
```

### Adding New Content

1. **Add the key to `TooltipContentKey` type:**

```tsx
export type TooltipContentKey =
  | 'existing.keys'
  | 'your.new.key';  // Add here
```

2. **Add default content:**

```tsx
const defaultTooltipContent: Record<TooltipContentKey, string> = {
  // ... existing content
  'your.new.key': 'Your tooltip text',
};
```

3. **Add translations (optional):**

```json
// locales/en.json
{
  "tooltip": {
    "your": {
      "new": {
        "key": "Your translated tooltip text"
      }
    }
  }
}
```

4. **Consider responsive behavior:**

```tsx
// Ensure content works well across screen sizes
'your.new.key': 'Concise text for mobile', // Keep under 50 chars for mobile
```

### Internationalization

The system automatically uses react-i18next for translations:

```tsx
// Will look for translation at "tooltip.post.like"
<Tooltip contentKey="post.like">
  <Button>Like</Button>
</Tooltip>
```

If no translation is found, it falls back to the default English content.

## Styling and Theming

### Variants

The tooltip supports different visual variants:

```tsx
<Tooltip variant="info" contentKey="general.info">
  <Icon name="info" />
</Tooltip>

<Tooltip variant="warning" contentKey="form.required">
  <Text>Required Field *</Text>
</Tooltip>

<Tooltip variant="error" content="This action cannot be undone">
  <Button>Delete</Button>
</Tooltip>
```

### Custom Styling

```tsx
<Tooltip
  contentKey="post.like"
  style={{
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
  }}
  textStyle={{
    color: 'white',
    fontSize: 14,
  }}
>
  <Button>Like</Button>
</Tooltip>
```

## Positioning

### Auto-positioning

By default, tooltips use intelligent positioning:

```tsx
<Tooltip position="auto" contentKey="post.like">
  <Button>Like</Button>
</Tooltip>
```

The tooltip will:
1. Try the preferred position
2. Check if it fits in the viewport
3. Automatically adjust to prevent clipping

### Manual Positioning

```tsx
<Tooltip position="top" contentKey="nav.home">
  <Icon name="home" />
</Tooltip>
```

## Accessibility

The tooltip system includes comprehensive accessibility features:

- **Screen reader support** - Uses `accessibilityLabel` and `accessibilityHint`
- **Keyboard navigation** - Supports focus and blur events
- **High contrast support** - Respects system accessibility settings
- **Reduced motion** - Honors `prefers-reduced-motion` settings

### Accessibility Best Practices

1. **Use descriptive content:**

```tsx
// Good
<Tooltip contentKey="post.like">
  <Button accessibilityLabel="Like this post">❤️</Button>
</Tooltip>

// Avoid
<Tooltip content="Click here">
  <Button>❤️</Button>
</Tooltip>
```

2. **Don't rely solely on tooltips for critical information:**

```tsx
// Good - Important info is visible
<View>
  <Text>Email *</Text>
  <Tooltip contentKey="form.required">
    <Icon name="info" />
  </Tooltip>
</View>

// Avoid - Critical info hidden in tooltip
<Tooltip content="This field is required">
  <Text>Email</Text>
</Tooltip>
```

## Responsive Design

The tooltip automatically adapts to different screen sizes:

### Desktop (≥1024px)
- Smaller, more compact tooltips
- Precise positioning near trigger elements
- Optimized for mouse interactions
- Maximum 2 lines of text

### Tablet (768px - 1023px)
- Medium-sized tooltips
- Balanced spacing and sizing
- Touch-friendly interactions

### Mobile (<768px)
- Larger, touch-friendly tooltips
- Full-screen modal on very small screens
- Maximum 3 lines of text
- Optimized for finger interactions

## Platform Considerations

### Web
- Uses hover events for mouse interactions
- Supports keyboard navigation
- Respects `prefers-reduced-motion`
- No full-screen overlay on desktop

### Mobile (iOS/Android)
- Uses press events instead of hover
- Automatically dismisses on scroll
- Optimized touch targets

### Performance
- Tooltips are rendered only when needed
- Automatic cleanup of event listeners
- Optimized re-renders with React.memo

## Examples

See `TooltipExample.tsx` for comprehensive usage examples including:
- Basic tooltips with predefined content
- Custom content tooltips
- Advanced control with hooks
- Multiple positioning examples
- Form field integration

## Migration Guide

If you have existing tooltip implementations:

1. **Replace custom tooltip components:**

```tsx
// Before
<CustomTooltip text="Like this post">
  <Button>Like</Button>
</CustomTooltip>

// After
<Tooltip contentKey="post.like">
  <Button>Like</Button>
</Tooltip>
```

2. **Centralize tooltip content:**

```tsx
// Before - scattered throughout components
const helpText = "This field is required";

// After - centralized in TooltipContent.ts
<Tooltip contentKey="form.required">
```

3. **Update accessibility attributes:**

```tsx
// Before
<Button accessibilityHint="Like this post">

// After - handled automatically
<Tooltip contentKey="post.like">
  <Button>
```

## Contributing

When adding new tooltip content:

1. Use descriptive, action-oriented text
2. Keep messages concise (under 50 characters when possible)
3. Follow the existing naming convention for keys
4. Add translations for supported languages
5. Test on all platforms
6. Ensure accessibility compliance

## Troubleshooting

### Common Issues

**Tooltip not showing:**
- Check if `disabled` prop is set to `true`
- Verify the trigger element is pressable/hoverable
- Ensure content or contentKey is provided

**Positioning issues:**
- Try using `position="auto"` for automatic positioning
- Adjust the `offset` prop if tooltip is too close/far
- Check if parent containers have `overflow: hidden`

**Performance issues:**
- Avoid creating tooltips in render loops
- Use `React.memo` for frequently re-rendered components
- Consider using `disabled` prop to conditionally disable tooltips

**Accessibility issues:**
- Ensure tooltip content is descriptive
- Test with screen readers
- Verify keyboard navigation works
- Check color contrast ratios