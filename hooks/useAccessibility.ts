import { useAccessibility as useAccessibilityContext } from '@/context/AccessibilityContext';

/**
 * Hook para acessar configurações de acessibilidade
 * Retorna as configurações atuais e funções utilitárias
 */
export const useAccessibility = () => {
  const accessibility = useAccessibilityContext();
  
  // Funções utilitárias para acessibilidade
  const getTextScale = (): number => {
    let scale = 1.0;
    
    if (accessibility.settings.largerText) {
      scale *= 1.2; // 20% larger
    }
    
    if (accessibility.settings.increaseFontSize) {
      scale *= 1.15; // Additional 15% larger
    }
    
    return scale;
  };

  const getFontWeight = (): 'normal' | 'bold' => {
    return accessibility.settings.boldText ? 'bold' : 'normal';
  };

  const getContrastMode = (): 'normal' | 'high' => {
    return accessibility.settings.increaseContrast ? 'high' : 'normal';
  };

  const getMotionPreference = (): 'normal' | 'reduced' => {
    return accessibility.settings.reduceMotion ? 'reduced' : 'normal';
  };

  // Função para criar estilos de texto acessíveis
  const createAccessibleTextStyle = (baseStyle: any) => {
    const textScale = getTextScale();
    const fontWeight = getFontWeight();
    
    return {
      ...baseStyle,
      fontSize: baseStyle.fontSize ? baseStyle.fontSize * textScale : undefined,
      fontWeight: fontWeight === 'bold' ? 'bold' : baseStyle.fontWeight,
    };
  };

  return {
    settings: accessibility.settings,
    updateSetting: accessibility.updateSetting,
    getTextScale,
    getFontWeight,
    getContrastMode,
    getMotionPreference,
    createAccessibleTextStyle,
  };
};
