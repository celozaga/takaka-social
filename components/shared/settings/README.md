# Settings Components

Este diretório contém componentes relacionados às configurações do app, incluindo acessibilidade, temas, notificações, etc.

## AccessibilityProvider

O `AccessibilityProvider` é um sistema completo de acessibilidade que integra automaticamente as configurações de acessibilidade do usuário ao layout do app.

### Funcionalidades

- **Larger Text**: Aumenta o tamanho do texto em 20%
- **Increase Font Size**: Aumenta adicionalmente o tamanho do texto em 15%
- **Bold Text**: Aplica negrito a todo o texto
- **High Contrast**: Aumenta o contraste das cores
- **Reduce Motion**: Reduz animações para usuários sensíveis a movimento

### Como usar

#### 1. Configurar o Provider

```tsx
import { AccessibilityProvider } from '@/components/shared/Settings';

export default function App() {
  return (
    <AccessibilityProvider>
      <YourApp />
    </AccessibilityProvider>
  );
}
```

#### 2. Usar componentes acessíveis

```tsx
import { 
  AccessibleText, 
  AccessibleView, 
  AccessibleTitle,
  MotionAwareView,
  ContrastAwareView 
} from '@/components/shared/Settings';

function MyComponent() {
  return (
    <AccessibleView style={{ padding: 16 }}>
      <AccessibleTitle>Este título será acessível</AccessibleTitle>
      <AccessibleText variant="bodyLarge">
        Este texto se adaptará automaticamente às configurações de acessibilidade
      </AccessibleText>
      
      <MotionAwareView 
        animatedStyle={{ transform: [{ scale: 1.1 }] }}
        style={{ backgroundColor: 'red' }}
      >
        Esta view respeitará as preferências de movimento
      </MotionAwareView>
      
      <ContrastAwareView 
        highContrastStyle={{ borderWidth: 2, borderColor: 'white' }}
      >
        Esta view aplicará alto contraste quando habilitado
      </ContrastAwareView>
    </AccessibleView>
  );
}
```

#### 3. Usar hooks de acessibilidade

```tsx
import { 
  useAccessibleColors, 
  useMotionPreference, 
  useContrastMode,
  useAccessibleStyles 
} from '@/components/shared/Settings';

function MyComponent() {
  const colors = useAccessibleColors();
  const motionPreference = useMotionPreference();
  const contrastMode = useContrastMode();
  const { createTextStyle } = useAccessibleStyles();
  
  const textStyle = createTextStyle({
    fontSize: 16,
    color: colors.onSurface,
  });
  
  return (
    <Text style={textStyle}>
      Texto com estilo acessível
    </Text>
  );
}
```

### Componentes Disponíveis

#### Text Components
- `AccessibleText`: Texto básico com acessibilidade
- `AccessibleTitle`: Título com estilo titleLarge
- `AccessibleSubtitle`: Subtítulo com estilo titleMedium
- `AccessibleBody`: Texto do corpo com estilo bodyLarge
- `AccessibleCaption`: Legenda com estilo bodySmall
- `AccessibleLabel`: Rótulo com estilo labelLarge

#### View Components
- `AccessibleView`: Container com estilos acessíveis
- `MotionAwareView`: Container que respeita preferências de movimento
- `ContrastAwareView`: Container que aplica alto contraste quando habilitado

#### Hooks
- `useAccessibleColors`: Obtém cores com contraste ajustado
- `useMotionPreference`: Verifica se o movimento está reduzido
- `useContrastMode`: Verifica o modo de contraste
- `useAccessibleStyles`: Cria estilos acessíveis

### Integração com Configurações

As configurações são gerenciadas pelo `AccessibilityContext` e podem ser alteradas na tela de configurações de acessibilidade (`/settings/accessibility`).

### Exemplo de Migração

**Antes:**
```tsx
import { Typography } from '@/components/shared';

<Typography variant="bodyLarge" color="onSurface">
  Texto normal
</Typography>
```

**Depois:**
```tsx
import { AccessibleText } from '@/components/shared/Settings';

<AccessibleText variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
  Texto acessível
</AccessibleText>
```

### Próximas Funcionalidades

- Suporte a leitores de tela
- Navegação por teclado
- Suporte a gestos alternativos
- Configurações de áudio
- Modo daltonismo
