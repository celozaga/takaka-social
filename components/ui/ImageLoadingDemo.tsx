import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { OptimizedImage } from './index';
import { useTheme } from '@/components/shared';

const ImageLoadingDemo: React.FC = () => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const testImageUrl = 'https://picsum.photos/300/200?random=1';
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comparação de Carregamento de Imagens</Text>
      
      <View style={styles.comparisonContainer}>
        <View style={styles.imageContainer}>
          <Text style={styles.label}>Image Padrão (expo-image)</Text>
          <Text style={styles.description}>Mostra ícone de erro brevemente</Text>
          <Image 
            source={{ uri: testImageUrl }}
            style={styles.image}
            contentFit="cover"
            placeholder={theme.colors.surfaceContainerHigh}
            transition={300}
          />
        </View>
        
        <View style={styles.imageContainer}>
          <Text style={styles.label}>OptimizedImage</Text>
          <Text style={styles.description}>Skeleton até carregar</Text>
          <OptimizedImage 
            source={{ uri: testImageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        </View>
      </View>
      
      <Text style={styles.explanation}>
        O OptimizedImage resolve o problema do ícone de "imagem não encontrada" 
        que aparece brevemente ao carregar imagens. Ele mostra um skeleton 
        até a imagem realmente começar a carregar.
      </Text>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.titleLarge,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    ...theme.typography.titleMedium,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  description: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  image: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  explanation: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ImageLoadingDemo;
