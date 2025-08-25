# Implementação de Vídeo com Bluesky Video

Este documento descreve a implementação do sistema de vídeo melhorado usando a biblioteca `@haileyok/bluesky-video` do Bluesky Social.

## Visão Geral

O sistema de vídeo foi redesenhado para oferecer uma experiência de reprodução mais robusta e otimizada, com fallback automático para o player padrão do Expo quando necessário.

## Componentes Principais

### 1. SmartVideoPlayer
Componente wrapper que escolhe automaticamente entre o player Bluesky e o fallback baseado na disponibilidade da biblioteca e configurações do usuário.

**Localização:** `components/watch/SmartVideoPlayer.tsx`

**Funcionalidades:**
- Detecção automática da disponibilidade da biblioteca Bluesky
- Fallback para expo-av quando necessário
- Integração com sistema de configuração

### 2. BlueskyVideoPlayer
Player de vídeo que usa a biblioteca `@haileyok/bluesky-video` para reprodução nativa otimizada.

**Localização:** `components/watch/BlueskyVideoPlayer.tsx`

**Vantagens:**
- Reprodução nativa otimizada
- Melhor performance em dispositivos móveis
- Suporte a controles nativos (fullscreen, mute, etc.)
- Gerenciamento automático de estado

### 3. VideoPlayerFallback
Player de vídeo que usa `expo-av` como fallback quando a biblioteca Bluesky não está disponível.

**Localização:** `components/watch/VideoPlayerFallback.tsx`

**Funcionalidades:**
- Reprodução usando expo-av
- Fallback automático entre diferentes formatos de vídeo
- Controles personalizados

## Hooks

### useBlueskyVideo
Hook personalizado para gerenciar o estado e controles do player Bluesky.

**Localização:** `hooks/useBlueskyVideo.ts`

**Funcionalidades:**
- Gerenciamento de estado do player
- Controles de reprodução
- Tratamento de eventos
- Resolução de URLs de vídeo

## Configuração

### VideoConfig
Sistema de configuração para personalizar o comportamento do player de vídeo.

**Localização:** `lib/videoConfig.ts`

**Opções disponíveis:**
- `preferredPlayer`: 'bluesky' | 'expo' | 'auto'
- `preferredQuality`: 'auto' | 'high' | 'medium' | 'low'
- `autoplay`: boolean
- `loop`: boolean
- `muted`: boolean
- `enableHLS`: boolean
- `enableStreaming`: boolean
- `enableFallback`: boolean
- `showControls`: boolean
- `showProgressBar`: boolean
- `showFullscreenButton`: boolean
- `bufferSize`: number
- `maxBitrate`: number
- `enableHardwareAcceleration`: boolean

## Instalação

A biblioteca `@haileyok/bluesky-video` já está instalada no projeto:

```bash
npm install @haileyok/bluesky-video
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

### Configuração Personalizada

```tsx
import { videoConfig } from '@/lib/videoConfig';

// Atualizar configurações
videoConfig.updateConfig({
  preferredPlayer: 'bluesky',
  preferredQuality: 'high',
  enableHardwareAcceleration: true
});

// Obter configuração atual
const config = videoConfig.getConfig();
```

## Migração

### De VideoPlayer para SmartVideoPlayer

**Antes:**
```tsx
import VideoPlayer from './VideoPlayer';

<VideoPlayer 
  postView={item} 
  paused={index !== activeIndex}
  isMuted={isFeedMuted}
  onMuteToggle={() => setIsFeedMuted(prev => !prev)}
/>
```

**Depois:**
```tsx
import SmartVideoPlayer from './SmartVideoPlayer';

<SmartVideoPlayer 
  postView={item} 
  paused={index !== activeIndex}
  isMuted={isFeedMuted}
  onMutedToggle={() => setIsFeedMuted(prev => !prev)}
/>
```

## Vantagens da Nova Implementação

1. **Performance Melhorada**: Player nativo otimizado para dispositivos móveis
2. **Fallback Robusto**: Sistema automático de fallback para garantir compatibilidade
3. **Configurabilidade**: Sistema flexível de configuração para diferentes cenários
4. **Manutenibilidade**: Código mais limpo e organizado
5. **Compatibilidade**: Suporte a diferentes plataformas e dispositivos

## Troubleshooting

### Problema: Vídeo não reproduz
1. Verificar se a biblioteca Bluesky está instalada
2. Verificar configurações de vídeo
3. Verificar logs de erro no console
4. Usar fallback automático

### Problema: Performance ruim
1. Verificar configuração de qualidade
2. Verificar se hardware acceleration está habilitado
3. Ajustar buffer size conforme necessário

### Problema: Controles não funcionam
1. Verificar se o player está ativo
2. Verificar configurações de UI
3. Verificar se os eventos estão sendo disparados corretamente

## Contribuição

Para contribuir com melhorias no sistema de vídeo:

1. Testar em diferentes dispositivos e plataformas
2. Verificar compatibilidade com diferentes formatos de vídeo
3. Documentar novas funcionalidades
4. Manter compatibilidade com o sistema de fallback

## Referências

- [Bluesky Video Library](https://github.com/bluesky-social/bluesky-video)
- [Expo AV Documentation](https://docs.expo.dev/versions/latest/sdk/av/)
- [React Native Video](https://github.com/react-native-video/react-native-video)
