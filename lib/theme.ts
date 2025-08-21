import { Platform } from 'react-native';

/**
 * ============================================================================
 * Xiaohongshu-Inspired Dark Theme
 * ============================================================================
 *
 * This theme provides design tokens (colors, spacing, fonts, etc.) to
 * replicate the look and feel of Xiaohongshu's dark mode UI.
 * It is used throughout the new PostScreen component.
 * ============================================================================
 */
export const theme = {
  color: {
    bg: "#0B0B0F",
    card: "#141419",
    line: "rgba(255,255,255,0.06)",
    textPrimary: "#F1F1F3",
    textSecondary: "#A3A3AD",
    textTertiary: "#7E7E88",
    accent: "#FF5B5B",          // like heart
    brand: "#FF2442",           // follow button fill
    badge: "#2B2B33",
    link: "#7AA2FF",
    inputBg: "#1A1A22",
  },
  radius: { 
    xs: 6, 
    sm: 10, 
    md: 14, 
    lg: 20, 
    xl: 28, 
    pill: 999 
  },
  spacing: { 
    xxs: 4, 
    xs: 8, 
    sm: 12, 
    md: 16, 
    lg: 20, 
    xl: 24, 
    xxl: 32 
  },
  font: { 
    title: 18, 
    body: 15, 
    small: 13, 
    tiny: 11 
  },
  shadow: { 
    card: Platform.select({
        ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
        },
        android: {
            elevation: 2,
        },
        web: {
            boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
        },
    }),
  },
};
