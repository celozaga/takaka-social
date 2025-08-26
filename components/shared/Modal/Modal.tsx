/**
 * ============================================================================
 * Modal Component
 * ============================================================================
 *
 * Universal modal component using React Native's Modal.
 * Provides consistent styling and behavior across platforms.
 *
 */

import React, { ReactNode } from 'react';
import { 
  Modal as RNModal, 
  View, 
  Pressable, 
  StyleSheet, 
  Dimensions,
  StyleProp,
  ViewStyle,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTheme } from '../Theme';

// ============================================================================
// Types
// ============================================================================

type ModalSize = 'sm' | 'md' | 'lg' | 'full';
type ModalPosition = 'center' | 'bottom';

interface ModalProps {
  /** Modal content */
  children: ReactNode;
  /** Whether modal is visible */
  visible: boolean;
  /** Called when modal should be closed */
  onClose: () => void;
  /** Modal size */
  size?: ModalSize;
  /** Modal position */
  position?: ModalPosition;
  /** Whether modal can be dismissed by backdrop tap */
  dismissible?: boolean;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether to avoid keyboard */
  keyboardAvoidingView?: boolean;
  /** Animation type */
  animationType?: 'none' | 'slide' | 'fade';
  /** Custom container style */
  containerStyle?: StyleProp<ViewStyle>;
  /** Custom content style */
  contentStyle?: StyleProp<ViewStyle>;
  /** Test ID for testing */
  testID?: string;
}

// ============================================================================
// Component
// ============================================================================

const Modal: React.FC<ModalProps> = ({
  children,
  visible,
  onClose,
  size = 'md',
  position = 'center',
  dismissible = true,
  showCloseButton = false,
  keyboardAvoidingView = false,
  animationType = 'fade',
  containerStyle,
  contentStyle,
  testID,
}) => {
  const { theme } = useTheme();
  const { width, height } = Dimensions.get('window');

  const getModalSize = () => {
    switch (size) {
      case 'sm':
        return { width: Math.min(320, width * 0.8), maxHeight: height * 0.6 };
      case 'md':
        return { width: Math.min(480, width * 0.9), maxHeight: height * 0.8 };
      case 'lg':
        return { width: Math.min(720, width * 0.95), maxHeight: height * 0.9 };
      case 'full':
        return { width: width, height: height };
      default:
        return { width: Math.min(480, width * 0.9), maxHeight: height * 0.8 };
    }
  };

  const getContentStyles = () => {
    const modalSize = getModalSize();
    const baseStyles: ViewStyle[] = [
      modalStyles.content,
      {
        backgroundColor: theme.colors.surface,
        borderRadius: size === 'full' ? 0 : theme.radius.lg,
        ...modalSize,
      },
    ];

    if (position === 'bottom') {
      baseStyles.push(modalStyles.bottomPosition);
    } else {
      baseStyles.push(modalStyles.centerPosition);
    }

    return baseStyles;
  };

  const handleBackdropPress = () => {
    if (dismissible) {
      onClose();
    }
  };

  const ModalContent = ({ children: modalChildren }: { children: ReactNode }) => (
    <View style={[modalStyles.overlay, containerStyle]}>
      <Pressable 
        style={modalStyles.backdrop} 
        onPress={handleBackdropPress}
        testID={`${testID}-backdrop`}
      />
      
      <View style={[...getContentStyles(), contentStyle]}>
        {showCloseButton && (
          <Pressable
            onPress={onClose}
            style={[
              modalStyles.closeButton,
              { 
                backgroundColor: theme.colors.surfaceContainer,
                top: theme.spacing.md,
                right: theme.spacing.md,
              }
            ]}
            testID={`${testID}-close`}
          >
            <View style={modalStyles.closeIcon}>
              <View style={[
                modalStyles.closeLine,
                { backgroundColor: theme.colors.onSurfaceVariant }
              ]} />
              <View style={[
                modalStyles.closeLine,
                modalStyles.closeLineRotated,
                { backgroundColor: theme.colors.onSurfaceVariant }
              ]} />
            </View>
          </Pressable>
        )}
        
        {modalChildren}
      </View>
    </View>
  );

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      testID={testID}
    >
      {keyboardAvoidingView ? (
        <KeyboardAvoidingView
          style={modalStyles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ModalContent>{children}</ModalContent>
        </KeyboardAvoidingView>
      ) : (
        <ModalContent>{children}</ModalContent>
      )}
    </RNModal>
  );
};

// ============================================================================
// Styles
// ============================================================================

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    position: 'relative',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerPosition: {
    // Default positioning in center
  },
  bottomPosition: {
    alignSelf: 'flex-end',
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  closeLineRotated: {
    transform: [{ rotate: '90deg' }],
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});

export default Modal;
