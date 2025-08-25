# Implementação de Vídeo com Expo AV Otimizado

Este documento descreve a implementação do sistema de vídeo otimizado usando `expo-av` com configurações de performance avançadas, similar ao que o app oficial do Bluesky usa.

## Visão Geral

O sistema de vídeo foi redesenhado para oferecer uma experiência de reprodução otimizada usando `expo-av` com configurações de performance avançadas. Este é agora o player principal do app, usado para todos os vídeos incluindo posts normais e a seção `/watch`.

## Componentes Principais

### 1. SmartVideoPlayer
Componente wrapper que usa diretamente o VideoPlayer.

**Localização:** `components/watch/SmartVideoPlayer.tsx`

**Funcionalidades:**
- Wrapper simples para o VideoPlayer
- Interface consistente para o sistema

### 2. VideoPlayer
Player de vídeo principal que usa `expo-av` com configurações otimizadas para reprodução de alta performance.

**Localização:** `components/watch/VideoPlayer.tsx`

**Vantagens:**
- Reprodução otimizada com expo-av
- Melhor performance em dispositivos móveis
- Suporte a controles nativos (fullscreen, mute, etc.)
- Gerenciamento automático de estado
- Configurações de performance avançadas
- Player principal para todo o app

## Hooks

### useVideoPlayer
Hook personalizado para gerenciar o estado e controles do player de vídeo.

**Localização:** `hooks/useVideoPlayer.ts`

**Funcionalidades:**
- Gerenciamento de estado do player
- Controles de reprodução
- Tratamento de eventos
- Resolução de URLs de vídeo

## Configuração

### VideoConfig
Sistema de configuração para personalizar o comportamento do player de vídeo.

**Localização:** `lib/video.ts`

**Opções disponíveis:**
- `preferredPlayer`: 'bluesky' (sempre)
- `preferredQuality`: 'auto' | 'high' | 'medium' | 'low'
- `autoplay`: boolean
- `loop`: boolean
- `muted`: boolean
- `enableHLS`: boolean
- `enableStreaming`: boolean
- `showControls`: boolean
- `showProgressBar`: boolean
- `showFullscreenButton`: boolean
- `bufferSize`: number
- `maxBitrate`: number
- `enableHardwareAcceleration`: boolean

## Instalação

As dependências necessárias já estão instaladas no projeto:

```bash
npm install expo-av expo-video
```

## Uso

### Uso Básico

```tsx
import SmartVideoPlayer from '@/components/watch/SmartVideoPlayer';

<SmartVideoPlayer
  postView={postView}
  paused={false}
  isMuted={true}
  onMuteToggle={() => setIsMuted(!isMuted)}
/>
```

### Uso Direto do VideoPlayer

```tsx
import VideoPlayer from '@/components/watch/VideoPlayer';

<VideoPlayer
  postView={postView}
  paused={false}
  isMuted={true}
  onMuteToggle={() => setIsMuted(!isMuted)}
/>
```

### Configuração Personalizada

```tsx
import { videoManager } from '@/lib/video';

// Atualizar configurações
videoManager.updateConfig({
  preferredQuality: 'high',
  enableHardwareAcceleration: true
});

// Obter configuração atual
const config = videoManager.getConfig();
```

## Migração

### De VideoPlayer Antigo para Novo VideoPlayer

**Antes:**
```tsx
import VideoPlayer from './VideoPlayer'; // Player antigo com expo-av básico

<VideoPlayer 
  postView={item} 
  paused={index !== activeIndex}
  isMuted={isFeedMuted}
  onMuteToggle={() => setIsFeedMuted(prev => !prev)}
/>
```

**Depois:**
```tsx
import VideoPlayer from './VideoPlayer'; // Novo player com expo-av otimizado

<VideoPlayer 
  postView={item} 
  paused={index !== activeIndex}
  isMuted={isFeedMuted}
  onMuteToggle={() => setIsFeedMuted(prev => !prev)}
/>
```

## Vantagens da Nova Implementação

1. **Performance Melhorada**: Player otimizado com expo-av
2. **Código Mais Limpo**: Sem complexidade de fallback
3. **Configurabilidade**: Sistema flexível de configuração
4. **Manutenibilidade**: Código mais simples e direto
5. **Compatibilidade**: Suporte nativo a diferentes plataformas
6. **Unificação**: Mesmo player para todos os vídeos do app
7. **Otimizações**: Configurações de performance avançadas

## Estrutura de Arquivos

```
components/watch/
├── VideoPlayer.tsx           # Player principal do app
├── SmartVideoPlayer.tsx      # Wrapper simples
└── VideoPostOverlay.tsx      # Overlay de informações

hooks/
└── useVideoPlayer.ts         # Hook principal

lib/
└── video.ts                  # Configuração e gerenciamento
```

## Otimizações de Performance

O novo VideoPlayer inclui várias otimizações:

- **useNativeControls={false}**: Controles personalizados para melhor UX
- **shouldCorrectPitch={false}**: Desabilita correção de pitch para melhor performance
- **progressUpdateIntervalMillis={100}**: Atualizações de progresso otimizadas
- **ResizeMode otimizado**: Melhor renderização baseada no aspect ratio
- **Gerenciamento de estado eficiente**: Sincronização otimizada entre estado interno e expo-av

## Troubleshooting

### Problema: Vídeo não reproduz
1. Verificar se expo-av está instalado
2. Verificar configurações de vídeo
3. Verificar logs de erro no console
4. Verificar se o dispositivo suporta o formato de vídeo

### Problema: Performance ruim
1. Verificar configuração de qualidade
2. Verificar se as otimizações estão habilitadas
3. Ajustar buffer size conforme necessário
4. Verificar se o dispositivo tem hardware acceleration

### Problema: Controles não funcionam
1. Verificar se o player está ativo
2. Verificar configurações de UI
3. Verificar se os eventos estão sendo disparados corretamente

## Contribuição

Para contribuir com melhorias no sistema de vídeo:

1. Testar em diferentes dispositivos e plataformas
2. Verificar compatibilidade com diferentes formatos de vídeo
3. Documentar novas funcionalidades
4. Manter compatibilidade com expo-av
5. Otimizar configurações de performance

## Referências

- [Expo AV Documentation](https://docs.expo.dev/versions/latest/sdk/av/)
- [Expo Video Documentation](https://docs.expo.dev/versions/latest/sdk/video/)
- [React Native Video](https://github.com/react-native-video/react-native-video)
