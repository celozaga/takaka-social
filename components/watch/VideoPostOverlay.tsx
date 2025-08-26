import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { AppBskyFeedDefs } from '@atproto/api';
import VideoActions from './VideoActions';
import RichTextRenderer from '../shared/RichTextRenderer';
import { Play } from 'lucide-react';
import { theme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface Props {
  post: AppBskyFeedDefs.PostView;
  onNext?: () => void;
  onPrevious?: () => void;
  isPlaying?: boolean;
  onTogglePlayPause?: () => void;
}

const VideoPostOverlay: React.FC<Props> = ({ post, onNext, onPrevious, isPlaying, onTogglePlayPause }) => {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const record = post.record as any;
  const { t } = useTranslation();

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const toggleDescription = useCallback((e: any) => { 
    e.stopPropagation(); 
    setIsDescriptionExpanded(prev => !prev); 
  }, []);
  const needsTruncation = record.text && (record.text.length > 100 || record.text.includes('\n'));

  // Função para truncar o nome do usuário se for muito longo
  const truncateUsername = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  // Formatar data em formato relativo (ex: "20 min ago", "1h ago", "23w ago")
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInMs = now.getTime() - postDate.getTime();
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);
    
    if (diffInMinutes < 1) {
      return 'agora mesmo';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d atrás`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks}w atrás`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths}m atrás`;
    } else {
      return `${diffInYears}y atrás`;
    }
  };

  return (
    <>
      {/* Layout estilo TikTok - informações do usuário e descrição na parte inferior esquerda */}
      <View style={[styles.bottomInfoContainer, isMobile && styles.bottomInfoContainerMobile]}>
        {/* Nome do usuário e data */}
        <View style={styles.userInfoRow}>
          <Text style={[styles.userNameTikTok, isMobile && styles.userNameTikTokMobile]} numberOfLines={1}>
            {truncateUsername(post.author.displayName || post.author.handle)}
          </Text>
          <Text style={styles.dateSeparator}> · </Text>
          <Text style={styles.postDateTikTok}>
            {formatRelativeTime(post.indexedAt)}
          </Text>
        </View>

        {/* Descrição do post */}
        {record.text && (
          <View style={styles.descriptionContainer}>
            <Text 
              style={[styles.descriptionTikTok, isMobile && styles.descriptionTikTokMobile]} 
              numberOfLines={isDescriptionExpanded ? undefined : 2}
            >
              {record.text}
            </Text>
            {!isDescriptionExpanded && needsTruncation && (
              <Pressable onPress={toggleDescription}>
                <Text style={styles.readMoreTextTikTok}>
                  {t('common.readMore')}
                </Text>
              </Pressable>
            )}
            {isDescriptionExpanded && needsTruncation && (
              <Pressable onPress={toggleDescription} style={styles.readMoreButton}>
                <Text style={styles.readMoreTextTikTok}>
                  {t('common.readLess')}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Controle central play/pause (mais discreto) */}
      {onTogglePlayPause && (
        <Pressable onPress={onTogglePlayPause} style={styles.centralPlayButton}>
          {!isPlaying && (
            <View style={styles.playButtonContainer}>
              <Play size={60} color="white" fill="rgba(255,255,255,0.9)" />
            </View>
          )}
        </Pressable>
      )}

      {/* Ações laterais estilo TikTok (incluindo avatar + botão de seguir) */}
      <VideoActions post={post} />
    </>
  );
};

const styles = StyleSheet.create({
  // Layout principal estilo TikTok
  bottomInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 80, // Espaço para ações laterais
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    zIndex: 30, // Aumentado para garantir que esteja acima de tudo
  },
  bottomInfoContainerMobile: {
    bottom: 15,
    right: 60, // Menos espaço em mobile
    paddingHorizontal: theme.spacing.s,
  },

  // Linha de informações do usuário
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
    flexWrap: 'nowrap', // Evita quebra de linha
  },
  userNameTikTok: {
    ...theme.typography.titleSmall,
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    maxWidth: 120, // Largura máxima para evitar sobreposição
    flexShrink: 1, // Permite que o texto encolha se necessário
  },
  userNameTikTokMobile: {
    maxWidth: 80, // Largura menor para mobile
  },
  dateSeparator: {
    ...theme.typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    flexShrink: 0, // Não permite que o separador encolha
  },
  postDateTikTok: {
    ...theme.typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.6)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    flexShrink: 0, // Não permite que a data encolha
  },

  // Container da descrição
  descriptionContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  
  // Texto da descrição estilo TikTok
  descriptionTikTok: {
    ...theme.typography.bodyMedium,
    color: 'white',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
    flexWrap: 'wrap',
  },
  descriptionTikTokMobile: {
    fontSize: 14,
    lineHeight: 16,
  },
  
  // Botão "mais/menos" - estilo minimalista
  readMoreButton: {
    // Sem margem para integrar com o texto
  },
  readMoreTextTikTok: {
    ...theme.typography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // Controle central play/pause
  centralPlayButton: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15, // Aumentado para estar acima do backgroundOverlay
  },
  playButtonContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default React.memo(VideoPostOverlay);