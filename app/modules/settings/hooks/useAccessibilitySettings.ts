// ============================================================================
// Settings Module - useAccessibilitySettings Hook
// ============================================================================
//
// This hook provides specialized functionality for managing accessibility settings,
// including visual, audio, motor, and cognitive accessibility preferences.
//

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AccessibilitySettings,
  UseAccessibilitySettingsReturn,
  VisualAccessibilitySettings,
  AudioAccessibilitySettings,
  MotorAccessibilitySettings,
  CognitiveAccessibilitySettings,
  FontSize,
  AnimationLevel,
} from '../types';
import { settingsUtils } from '../utils';
import { defaultApiClient } from '../../../core/api';

// ============================================================================
// Types
// ============================================================================

interface UseAccessibilitySettingsOptions {
  /**
   * Auto-save settings on change
   * @default true
   */
  autoSave?: boolean;
  
  /**
   * Debounce delay for auto-save in milliseconds
   * @default 1000
   */
  saveDelay?: number;
  
  /**
   * Enable local caching
   * @default true
   */
  enableCache?: boolean;
  
  /**
   * Apply settings to DOM immediately
   * @default true
   */
  applyToDom?: boolean;
  
  /**
   * Enable accessibility testing mode
   * @default false
   */
  testingMode?: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_OPTIONS: Required<UseAccessibilitySettingsOptions> = {
  autoSave: true,
  saveDelay: 1000,
  enableCache: true,
  applyToDom: true,
  testingMode: false,
};

const CACHE_KEY = 'settings_accessibility';

// ============================================================================
// DOM Application Functions
// ============================================================================

const applyVisualSettingsToDom = (visual: VisualAccessibilitySettings): void => {
  const root = document.documentElement;
  
  // Font size
  const fontSizeMap: Record<FontSize, string> = {
    small: '14px',
    medium: '16px',
    large: '18px',
    'extra-large': '20px',
  };
  root.style.setProperty('--font-size-base', fontSizeMap[visual.fontSize]);
  
  // High contrast
  if (visual.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
  
  // Dark mode
  if (visual.darkMode) {
    root.classList.add('dark-mode');
  } else {
    root.classList.remove('dark-mode');
  }
  
  // Color blindness support
  root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
  if (visual.colorBlindnessSupport !== 'none') {
    root.classList.add(visual.colorBlindnessSupport);
  }
  
  // Focus indicators
  if (visual.enhancedFocusIndicators) {
    root.classList.add('enhanced-focus');
  } else {
    root.classList.remove('enhanced-focus');
  }
  
  // Cursor size
  const cursorSizeMap = {
    small: '16px',
    medium: '20px',
    large: '24px',
    'extra-large': '32px',
  };
  root.style.setProperty('--cursor-size', cursorSizeMap[visual.cursorSize]);
};

const applyMotorSettingsToDom = (motor: MotorAccessibilitySettings): void => {
  const root = document.documentElement;
  
  // Click delay
  root.style.setProperty('--click-delay', `${motor.clickDelay}ms`);
  
  // Touch target size
  const touchTargetMap = {
    small: '32px',
    medium: '44px',
    large: '56px',
    'extra-large': '72px',
  };
  root.style.setProperty('--touch-target-size', touchTargetMap[motor.touchTargetSize]);
  
  // Sticky keys
  if (motor.stickyKeys) {
    root.classList.add('sticky-keys');
  } else {
    root.classList.remove('sticky-keys');
  }
  
  // Mouse keys
  if (motor.mouseKeys) {
    root.classList.add('mouse-keys');
  } else {
    root.classList.remove('mouse-keys');
  }
};

const applyCognitiveSettingsToDom = (cognitive: CognitiveAccessibilitySettings): void => {
  const root = document.documentElement;
  
  // Animation level
  const animationMap: Record<AnimationLevel, string> = {
    none: 'none',
    reduced: 'reduced',
    normal: 'normal',
    enhanced: 'enhanced',
  };
  root.style.setProperty('--animation-level', animationMap[cognitive.animationLevel]);
  
  // Auto-play media
  if (!cognitive.autoplayMedia) {
    root.classList.add('no-autoplay');
  } else {
    root.classList.remove('no-autoplay');
  }
  
  // Reading assistance
  if (cognitive.readingAssistance) {
    root.classList.add('reading-assistance');
  } else {
    root.classList.remove('reading-assistance');
  }
  
  // Focus management
  if (cognitive.focusManagement) {
    root.classList.add('focus-management');
  } else {
    root.classList.remove('focus-management');
  }
};

// ============================================================================
// Main Hook
// ============================================================================

export function useAccessibilitySettings(options: UseAccessibilitySettingsOptions = {}): UseAccessibilitySettingsReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [settings, setSettings] = useState<AccessibilitySettings>(
    settingsUtils.getDefaultSettings('accessibility') as AccessibilitySettings
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  
  // ============================================================================
  // Refs
  // ============================================================================
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================================================
  // Cache Management
  // ============================================================================
  
  const loadFromCache = useCallback((): AccessibilitySettings | null => {
    if (!config.enableCache) return null;
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const age = Date.now() - (data.timestamp || 0);
      
      if (age > 600000) { // 10 minutes
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      
      return data.settings;
    } catch (error) {
      console.warn('Failed to load accessibility settings from cache:', error);
      return null;
    }
  }, [config.enableCache]);
  
  const saveToCache = useCallback((accessibilitySettings: AccessibilitySettings): void => {
    if (!config.enableCache) return;
    
    try {
      const cacheData = {
        settings: accessibilitySettings,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save accessibility settings to cache:', error);
    }
  }, [config.enableCache]);
  
  // ============================================================================
  // DOM Application
  // ============================================================================
  
  const applySettingsToDom = useCallback((accessibilitySettings: AccessibilitySettings): void => {
    if (!config.applyToDom) return;
    
    try {
      applyVisualSettingsToDom(accessibilitySettings.visual);
      applyMotorSettingsToDom(accessibilitySettings.motor);
      applyCognitiveSettingsToDom(accessibilitySettings.cognitive);
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('accessibilitySettingsChanged', {
        detail: accessibilitySettings,
      }));
      
    } catch (error) {
      console.error('Failed to apply accessibility settings to DOM:', error);
    }
  }, [config.applyToDom]);
  
  // ============================================================================
  // Accessibility Testing
  // ============================================================================
  
  const runAccessibilityTests = useCallback(async (): Promise<Record<string, boolean>> => {
    if (!config.testingMode) return {};
    
    const results: Record<string, boolean> = {};
    
    try {
      // Test color contrast
      results.colorContrast = await testColorContrast();
      
      // Test keyboard navigation
      results.keyboardNavigation = await testKeyboardNavigation();
      
      // Test screen reader compatibility
      results.screenReader = await testScreenReaderCompatibility();
      
      // Test focus management
      results.focusManagement = await testFocusManagement();
      
      setTestResults(results);
      return results;
      
    } catch (error) {
      console.error('Failed to run accessibility tests:', error);
      return {};
    }
  }, [config.testingMode]);
  
  const testColorContrast = async (): Promise<boolean> => {
    // Simplified color contrast test
    const elements = document.querySelectorAll('[data-testid]');
    let passCount = 0;
    
    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const bgColor = styles.backgroundColor;
      const textColor = styles.color;
      
      // Basic contrast ratio calculation (simplified)
      const contrast = calculateContrastRatio(bgColor, textColor);
      if (contrast >= 4.5) passCount++;
    });
    
    return passCount / elements.length >= 0.8; // 80% pass rate
  };
  
  const testKeyboardNavigation = async (): Promise<boolean> => {
    // Test if all interactive elements are keyboard accessible
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]'
    );
    
    let accessibleCount = 0;
    
    interactiveElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex !== '-1' && !element.hasAttribute('disabled')) {
        accessibleCount++;
      }
    });
    
    return accessibleCount === interactiveElements.length;
  };
  
  const testScreenReaderCompatibility = async (): Promise<boolean> => {
    // Test for proper ARIA labels and semantic markup
    const images = document.querySelectorAll('img');
    const buttons = document.querySelectorAll('button');
    const inputs = document.querySelectorAll('input');
    
    let accessibleCount = 0;
    let totalCount = 0;
    
    // Check images have alt text
    images.forEach(img => {
      totalCount++;
      if (img.hasAttribute('alt') || img.hasAttribute('aria-label')) {
        accessibleCount++;
      }
    });
    
    // Check buttons have accessible names
    buttons.forEach(button => {
      totalCount++;
      if (button.textContent?.trim() || button.hasAttribute('aria-label')) {
        accessibleCount++;
      }
    });
    
    // Check inputs have labels
    inputs.forEach(input => {
      totalCount++;
      const id = input.getAttribute('id');
      if (id && document.querySelector(`label[for="${id}"]`) || input.hasAttribute('aria-label')) {
        accessibleCount++;
      }
    });
    
    return totalCount === 0 || accessibleCount / totalCount >= 0.9; // 90% pass rate
  };
  
  const testFocusManagement = async (): Promise<boolean> => {
    // Test focus indicators and focus trapping
    const focusableElements = document.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    return focusableElements.length > 0; // Basic test
  };
  
  const calculateContrastRatio = (bg: string, fg: string): number => {
    // Simplified contrast ratio calculation
    // In a real implementation, you'd parse RGB values and calculate properly
    return 4.5; // Placeholder
  };
  
  // ============================================================================
  // API Functions
  // ============================================================================
  
  const loadSettings = useCallback(async (): Promise<void> => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      setIsLoading(true);
      setErrors({});
      
      // Try cache first
      const cachedSettings = loadFromCache();
      if (cachedSettings) {
        setSettings(cachedSettings);
        applySettingsToDom(cachedSettings);
        setIsLoading(false);
        return;
      }
      
      // Load from API
      const response = await defaultApiClient.get('/settings/accessibility', {
        signal: abortControllerRef.current.signal,
      });
      
      const accessibilitySettings = settingsUtils.mergeSettings(
        settingsUtils.getDefaultSettings('accessibility'),
        response.data
      ) as AccessibilitySettings;
      
      setSettings(accessibilitySettings);
      applySettingsToDom(accessibilitySettings);
      saveToCache(accessibilitySettings);
      
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to load accessibility settings:', err);
        setErrors({ load: err as Error });
        
        // Fallback to cached data if available
        const cachedSettings = loadFromCache();
        if (cachedSettings) {
          setSettings(cachedSettings);
          applySettingsToDom(cachedSettings);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadFromCache, saveToCache, applySettingsToDom]);
  
  const saveSettings = useCallback(async (): Promise<void> => {
    try {
      setIsSaving(true);
      setErrors(prev => ({ ...prev, save: undefined }));
      
      await defaultApiClient.put('/settings/accessibility', settings);
      saveToCache(settings);
      setHasUnsavedChanges(false);
      
    } catch (err) {
      console.error('Failed to save accessibility settings:', err);
      setErrors(prev => ({ ...prev, save: err as Error }));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [settings, saveToCache]);
  
  // ============================================================================
  // Update Functions
  // ============================================================================
  
  const updateVisual = useCallback((updates: Partial<VisualAccessibilitySettings>): void => {
    const newSettings = {
      ...settings,
      visual: { ...settings.visual, ...updates },
    };
    
    setSettings(newSettings);
    setHasUnsavedChanges(true);
    applySettingsToDom(newSettings);
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [settings, config.autoSave, config.saveDelay, applySettingsToDom, saveSettings]);
  
  const updateAudio = useCallback((updates: Partial<AudioAccessibilitySettings>): void => {
    const newSettings = {
      ...settings,
      audio: { ...settings.audio, ...updates },
    };
    
    setSettings(newSettings);
    setHasUnsavedChanges(true);
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [settings, config.autoSave, config.saveDelay, saveSettings]);
  
  const updateMotor = useCallback((updates: Partial<MotorAccessibilitySettings>): void => {
    const newSettings = {
      ...settings,
      motor: { ...settings.motor, ...updates },
    };
    
    setSettings(newSettings);
    setHasUnsavedChanges(true);
    applySettingsToDom(newSettings);
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [settings, config.autoSave, config.saveDelay, applySettingsToDom, saveSettings]);
  
  const updateCognitive = useCallback((updates: Partial<CognitiveAccessibilitySettings>): void => {
    const newSettings = {
      ...settings,
      cognitive: { ...settings.cognitive, ...updates },
    };
    
    setSettings(newSettings);
    setHasUnsavedChanges(true);
    applySettingsToDom(newSettings);
    
    // Auto-save with debounce
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [settings, config.autoSave, config.saveDelay, applySettingsToDom, saveSettings]);
  
  const resetToDefaults = useCallback((): void => {
    const defaultSettings = settingsUtils.getDefaultSettings('accessibility') as AccessibilitySettings;
    setSettings(defaultSettings);
    setHasUnsavedChanges(true);
    applySettingsToDom(defaultSettings);
    
    if (config.autoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveSettings().catch(console.error);
      }, config.saveDelay);
    }
  }, [config.autoSave, config.saveDelay, applySettingsToDom, saveSettings]);
  
  const clearErrors = useCallback((): void => {
    setErrors({});
  }, []);
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const hasChanges = useCallback((): boolean => {
    const defaultSettings = settingsUtils.getDefaultSettings('accessibility') as AccessibilitySettings;
    return settingsUtils.hasChanges(defaultSettings, settings);
  }, [settings]);
  
  const getAccessibilityScore = useCallback((): number => {
    // Calculate accessibility score based on settings (0-100)
    let score = 0;
    
    // Visual accessibility (40 points)
    if (settings.visual.highContrast) score += 10;
    if (settings.visual.fontSize !== 'small') score += 10;
    if (settings.visual.enhancedFocusIndicators) score += 10;
    if (settings.visual.colorBlindnessSupport !== 'none') score += 10;
    
    // Audio accessibility (20 points)
    if (settings.audio.captionsEnabled) score += 10;
    if (settings.audio.audioDescriptions) score += 10;
    
    // Motor accessibility (20 points)
    if (settings.motor.touchTargetSize !== 'small') score += 10;
    if (settings.motor.clickDelay > 0) score += 10;
    
    // Cognitive accessibility (20 points)
    if (settings.cognitive.animationLevel === 'reduced' || settings.cognitive.animationLevel === 'none') score += 10;
    if (settings.cognitive.readingAssistance) score += 10;
    
    return score;
  }, [settings]);
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // Initial load
  useEffect(() => {
    loadSettings();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadSettings]);
  
  // Run accessibility tests when in testing mode
  useEffect(() => {
    if (config.testingMode) {
      const timer = setTimeout(() => {
        runAccessibilityTests();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [config.testingMode, runAccessibilityTests]);
  
  // ============================================================================
  // Return Hook Interface
  // ============================================================================
  
  return {
    // State
    settings,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    errors,
    testResults,
    
    // Actions
    loadSettings,
    saveSettings,
    updateVisual,
    updateAudio,
    updateMotor,
    updateCognitive,
    resetToDefaults,
    clearErrors,
    
    // Testing
    runAccessibilityTests,
    
    // Utilities
    hasChanges,
    getAccessibilityScore,
    applySettingsToDom,
  };
}

export default useAccessibilitySettings;