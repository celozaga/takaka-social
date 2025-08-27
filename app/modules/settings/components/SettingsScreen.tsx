// ============================================================================
// Settings Module - SettingsScreen Component
// ============================================================================
//
// A base layout component for settings screens with consistent styling,
// navigation, and common functionality like search and save states.
//

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../core/ui/theme';
import { Icon } from '../../../core/ui/components';

// ============================================================================
// Types
// ============================================================================

export interface SettingsScreenProps {
  /**
   * Screen title
   */
  title: string;
  
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  
  /**
   * Children components (usually SettingsSection components)
   */
  children: React.ReactNode;
  
  /**
   * Whether to show a search bar
   */
  searchable?: boolean;
  
  /**
   * Search placeholder text
   */
  searchPlaceholder?: string;
  
  /**
   * Search callback
   */
  onSearch?: (query: string) => void;
  
  /**
   * Whether to show a back button
   */
  showBackButton?: boolean;
  
  /**
   * Back button callback
   */
  onBack?: () => void;
  
  /**
   * Right header actions
   */
  rightActions?: React.ReactNode;
  
  /**
   * Whether there are unsaved changes
   */
  hasUnsavedChanges?: boolean;
  
  /**
   * Save callback
   */
  onSave?: () => void;
  
  /**
   * Whether save is in progress
   */
  saving?: boolean;
  
  /**
   * Whether the screen is loading
   */
  loading?: boolean;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Success message to display
   */
  success?: string;
  
  /**
   * Custom header content
   */
  headerContent?: React.ReactNode;
  
  /**
   * Custom footer content
   */
  footerContent?: React.ReactNode;
  
  /**
   * Scroll view props
   */
  scrollViewProps?: any;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

export function SettingsScreen({
  title,
  subtitle,
  children,
  searchable = false,
  searchPlaceholder = 'Search settings...',
  onSearch,
  showBackButton = true,
  onBack,
  rightActions,
  hasUnsavedChanges = false,
  onSave,
  saving = false,
  loading = false,
  error,
  success,
  headerContent,
  footerContent,
  scrollViewProps,
  testID,
}: SettingsScreenProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  
  // ============================================================================
  // Handlers
  // ============================================================================
  
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  }, [onSearch]);
  
  const handleSave = useCallback(() => {
    if (saving) return;
    onSave?.();
  }, [onSave, saving]);
  
  // ============================================================================
  // Styles
  // ============================================================================
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    
    header: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
      paddingTop: Platform.OS === 'ios' ? 0 : 8,
    },
    
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 56,
    },
    
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    
    titleContainer: {
      flex: 1,
      marginRight: 8,
    },
    
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: subtitle ? 2 : 0,
    },
    
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    
    rightActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    saveButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginLeft: 8,
    },
    
    saveButtonDisabled: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    
    saveButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    
    saveButtonTextDisabled: {
      color: theme.colors.onSurfaceVariant,
    },
    
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
    },
    
    searchInput: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    
    messageContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    errorContainer: {
      backgroundColor: theme.colors.errorSurface,
    },
    
    successContainer: {
      backgroundColor: theme.colors.successSurface,
    },
    
    messageText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 18,
      marginLeft: 8,
    },
    
    errorText: {
      color: theme.colors.error,
    },
    
    successText: {
      color: theme.colors.success,
    },
    
    content: {
      flex: 1,
    },
    
    scrollContent: {
      paddingBottom: 32,
    },
    
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
    },
    
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    
    footer: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
  });
  
  // ============================================================================
  // Render Methods
  // ============================================================================
  
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {/* Back Button */}
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            testID={testID ? `${testID}-back` : undefined}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon
              name="arrow-left"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        )}
        
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
        
        {/* Right Actions */}
        <View style={styles.rightActions}>
          {rightActions}
          
          {/* Save Button */}
          {hasUnsavedChanges && onSave && (
            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
              testID={testID ? `${testID}-save` : undefined}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
            >
              <Text
                style={[
                  styles.saveButtonText,
                  saving && styles.saveButtonTextDisabled,
                ]}
              >
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Custom Header Content */}
      {headerContent}
      
      {/* Search */}
      {searchable && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            testID={testID ? `${testID}-search` : undefined}
            accessibilityLabel="Search settings"
          />
        </View>
      )}
    </View>
  );
  
  const renderMessages = () => {
    if (!error && !success) return null;
    
    return (
      <>
        {error && (
          <View style={[styles.messageContainer, styles.errorContainer]}>
            <Icon
              name="alert-circle"
              size={20}
              color={theme.colors.error}
            />
            <Text style={[styles.messageText, styles.errorText]}>
              {error}
            </Text>
          </View>
        )}
        
        {success && (
          <View style={[styles.messageContainer, styles.successContainer]}>
            <Icon
              name="check-circle"
              size={20}
              color={theme.colors.success}
            />
            <Text style={[styles.messageText, styles.successText]}>
              {success}
            </Text>
          </View>
        )}
      </>
    );
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Icon
            name="loader"
            size={32}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      );
    }
    
    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...scrollViewProps}
      >
        {renderMessages()}
        {children}
      </ScrollView>
    );
  };
  
  const renderFooter = () => {
    if (!footerContent) return null;
    
    return (
      <View style={styles.footer}>
        {footerContent}
      </View>
    );
  };
  
  // ============================================================================
  // Render
  // ============================================================================
  
  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {renderHeader()}
        {renderContent()}
        {renderFooter()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SettingsScreen;