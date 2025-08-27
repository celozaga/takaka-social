import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

interface AccessibilitySettings {
  // Text Accessibility
  largerText: boolean;
  boldText: boolean;
  increaseFontSize: boolean;
  
  // Visual Accessibility
  reduceMotion: boolean;
  increaseContrast: boolean;
  
  // Media Accessibility
  autoPlayVideos: boolean;
  showAltText: boolean;
  
  // Interaction Accessibility
  soundEffects: boolean;
  hapticFeedback: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => Promise<void>;
  getTextScale: () => number;
  getFontWeight: () => 'normal' | 'bold';
  isLargerTextEnabled: () => boolean;
  isBoldTextEnabled: () => boolean;
  isIncreaseFontSizeEnabled: () => boolean;
}

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  largerText: false,
  boldText: false,
  increaseFontSize: false,
  reduceMotion: false,
  increaseContrast: false,
  autoPlayVideos: true,
  showAltText: true,
  soundEffects: true,
  hapticFeedback: true,
};

// ============================================================================
// Storage Key
// ============================================================================

const ACCESSIBILITY_STORAGE_KEY = '@takaka/accessibility-settings';

// ============================================================================
// Context
// ============================================================================

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    loadAccessibilitySettings();
  }, []);

  const loadAccessibilitySettings = async () => {
    try {
      setIsLoading(true);
      const storedSettings = await AsyncStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...DEFAULT_ACCESSIBILITY_SETTINGS, ...parsedSettings });
      } else {
        setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
      setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof AccessibilitySettings, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // Save to storage
      await AsyncStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(newSettings));
      
      // Apply accessibility changes immediately
      applyAccessibilitySettings(newSettings);
    } catch (error) {
      console.error('Failed to save accessibility setting:', error);
      // Revert on failure
      setSettings(settings);
    }
  };

  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    // Apply text accessibility settings
    if (newSettings.largerText) {
      console.log('Larger text enabled');
    }
    
    if (newSettings.boldText) {
      console.log('Bold text enabled');
    }
    
    if (newSettings.increaseFontSize) {
      console.log('Increase font size enabled');
    }
    
    // Apply other accessibility settings
    if (newSettings.reduceMotion) {
      console.log('Motion reduction enabled');
    }
    
    if (newSettings.increaseContrast) {
      console.log('Contrast increase enabled');
    }
  };

  // Utility functions for text accessibility
  const getTextScale = (): number => {
    let scale = 1.0;
    
    if (settings.largerText) {
      scale *= 1.2; // 20% larger
    }
    
    if (settings.increaseFontSize) {
      scale *= 1.15; // Additional 15% larger
    }
    
    // Debug logs
    if (__DEV__) {
      console.log('🔍 getTextScale Debug:', {
        largerText: settings.largerText,
        increaseFontSize: settings.increaseFontSize,
        finalScale: scale,
      });
    }
    
    return scale;
  };

  const getFontWeight = (): 'normal' | 'bold' => {
    const weight = settings.boldText ? 'bold' : 'normal';
    
    // Debug logs
    if (__DEV__) {
      console.log('🔍 getFontWeight Debug:', {
        boldText: settings.boldText,
        finalWeight: weight,
      });
    }
    
    return weight;
  };

  const isLargerTextEnabled = (): boolean => {
    return settings.largerText;
  };

  const isBoldTextEnabled = (): boolean => {
    return settings.boldText;
  };

  const isIncreaseFontSizeEnabled = (): boolean => {
    return settings.increaseFontSize;
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    getTextScale,
    getFontWeight,
    isLargerTextEnabled,
    isBoldTextEnabled,
    isIncreaseFontSizeEnabled,
  };

  if (isLoading) {
    // Return a loading state or fallback
    return <>{children}</>;
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  
  return context;
};

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get text scale factor for accessibility
 */
export const useTextScale = (): number => {
  const { getTextScale } = useAccessibility();
  return getTextScale();
};

/**
 * Hook to get font weight for accessibility
 */
export const useFontWeight = (): 'normal' | 'bold' => {
  const { getFontWeight } = useAccessibility();
  return getFontWeight();
};

/**
 * Hook to create accessibility-aware text styles
 */
export const useAccessibleTextStyles = () => {
  const { getTextScale, getFontWeight } = useAccessibility();
  
  return {
    textScale: getTextScale(),
    fontWeight: getFontWeight(),
    createTextStyle: (baseStyle: any) => ({
      ...baseStyle,
      fontSize: baseStyle.fontSize ? baseStyle.fontSize * getTextScale() : undefined,
      fontWeight: getFontWeight(),
    }),
  };
};

export { AccessibilityProvider };
export default AccessibilityProvider;
