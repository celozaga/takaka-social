import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAccessibility } from '@/context/AccessibilityContext';
import { AccessibleText } from './AccessibleText';
import { useTheme } from './Theme/ThemeProvider';

/**
 * Componente de teste para verificar se as configurações de acessibilidade estão funcionando
 */
export const AccessibilityTest: React.FC = () => {
  const { settings } = useAccessibility();
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <AccessibleText variant="titleLarge" style={styles.title}>
        Teste de Acessibilidade
      </AccessibleText>
      
      <AccessibleText variant="bodyMedium" style={styles.subtitle}>
        Este texto deve se adaptar às configurações de acessibilidade
      </AccessibleText>
      
      <View style={styles.settingsInfo}>
        <AccessibleText variant="bodySmall" style={styles.setting}>
          Larger Text: {settings.largerText ? '✅ Ativado' : '❌ Desativado'}
        </AccessibleText>
        
        <AccessibleText variant="bodySmall" style={styles.setting}>
          Bold Text: {settings.boldText ? '✅ Ativado' : '❌ Desativado'}
        </AccessibleText>
        
        <AccessibleText variant="bodySmall" style={styles.setting}>
          Increase Font Size: {settings.increaseFontSize ? '✅ Ativado' : '❌ Desativado'}
        </AccessibleText>
      </View>
      
      <AccessibleText variant="bodyLarge" style={styles.testText}>
        Este é um texto de teste para verificar se o tamanho da fonte e o peso estão sendo aplicados corretamente.
      </AccessibleText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  settingsInfo: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  setting: {
    fontFamily: 'monospace',
  },
  testText: {
    textAlign: 'justify',
    lineHeight: 24,
  },
});

export default AccessibilityTest;
