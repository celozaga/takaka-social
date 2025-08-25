
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { FlatList, View, ActivityIndicator, Text, useWindowDimensions, StyleSheet, RefreshControl } from 'react-native';
import { AppBskyFeedDefs } from '@atproto/api';
import SmartVideoPlayer from './SmartVideoPlayer';
import { theme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface Props {
  videoPosts: AppBskyFeedDefs.FeedViewPost[];
  loadMore: () => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onActiveIndexChange?: (index: number) => void;
}

const WatchFeed: React.FC<Props> = ({ videoPosts, loadMore, isLoadingMore, hasMore, onRefresh, isRefreshing, onActiveIndexChange }) => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFeedMuted, setIsFeedMuted] = useState(true);
  const { height } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);

  // Melhorada detecção de vídeo ativo para comportamento tipo TikTok
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      // Encontra o item mais visível (maior área de visualização)
      const mostVisible = viewableItems.reduce((prev: any, current: any) => {
        return (current.viewabilityConfig?.viewAreaCoveragePercentThreshold || 0) > 
               (prev.viewabilityConfig?.viewAreaCoveragePercentThreshold || 0) ? current : prev;
      });
      
      const newIndex = mostVisible.index;
      if (newIndex !== activeIndex && newIndex !== null && newIndex !== undefined) {
        console.log('🎯 Video ativo mudou para índice:', newIndex);
        setActiveIndex(newIndex);
        
        // Chamar preload para vídeos próximos
        if (onActiveIndexChange) {
          onActiveIndexChange(newIndex);
        }
      }
    }
  }).current;

  // Configuração melhorada para detecção de visibilidade
  const viewConfigRef = useRef({ 
    viewAreaCoveragePercentThreshold: 70, // Aumentado para 70% para melhor detecção
    minimumViewTime: 300, // Mínimo de 300ms para considerar como ativo
    waitForInteraction: false, // Não esperar interação para mudança
  });

  // Garantir que o primeiro vídeo seja ativado quando a lista carregar
  useEffect(() => {
    if (videoPosts.length > 0 && activeIndex === null) {
      setActiveIndex(0);
    }
  }, [videoPosts.length, activeIndex]);

  // Função para pular para próximo vídeo (gesto de swipe)
  const goToNext = useCallback(() => {
    if (activeIndex < videoPosts.length - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      
      // Preload dos vídeos próximos
      if (onActiveIndexChange) {
        onActiveIndexChange(nextIndex);
      }
    }
  }, [activeIndex, videoPosts.length, onActiveIndexChange]);

  // Função para voltar ao vídeo anterior  
  const goToPrevious = useCallback(() => {
    if (activeIndex > 0) {
      const prevIndex = activeIndex - 1;
      setActiveIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      
      // Preload dos vídeos próximos
      if (onActiveIndexChange) {
        onActiveIndexChange(prevIndex);
      }
    }
  }, [activeIndex, onActiveIndexChange]);

  return (
    <FlatList
      ref={flatListRef}
      data={videoPosts}
      keyExtractor={(item: AppBskyFeedDefs.FeedViewPost) => item.post.uri}
      renderItem={({ item, index }: { item: AppBskyFeedDefs.FeedViewPost; index: number }) => (
        <View style={{ height }}>
          <SmartVideoPlayer 
            postView={item} 
            paused={index !== activeIndex}
            isMuted={isFeedMuted}
            onMuteToggle={() => setIsFeedMuted(prev => !prev)}
            onNext={goToNext}
            onPrevious={goToPrevious}
            isActive={index === activeIndex}
          />
        </View>
      )}
      // Otimizações de performance estilo TikTok
      pagingEnabled
      showsVerticalScrollIndicator={false}
      decelerationRate="fast" // Scroll mais responsivo
      snapToInterval={height} // Snap preciso para cada vídeo
      snapToAlignment="start"
      disableIntervalMomentum={true} // Evita scroll duplo
      
      // Sistema de visibilidade melhorado
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewConfigRef.current}
      
      // Loading e paginação
      onEndReached={loadMore}
      onEndReachedThreshold={1.5}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="white"
          progressBackgroundColor="rgba(255,255,255,0.1)"
        />
      }
      
      ListFooterComponent={() => {
        if (isLoadingMore) return (
          <View style={[styles.loadingContainer, {height}]}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        );
        if (!hasMore && videoPosts.length > 0) return (
          <View style={[styles.fullScreenCentered, {height}]}>
            <Text style={styles.endText}>{t('watch.allSeenTitle')}</Text>
            <Text style={styles.endSubText}>{t('watch.allSeenDescription')}</Text>
          </View>
        );
        return null;
      }}
      
      // Otimizações de renderização para performance
      windowSize={5} // Renderizar 5 telas (2 acima + atual + 2 abaixo)
      initialNumToRender={2} // Renderizar 2 inicialmente para preloading
      maxToRenderPerBatch={2} // Máximo 2 por batch para não travar
      updateCellsBatchingPeriod={100} // Atualizar células a cada 100ms
      removeClippedSubviews={true} // Remove views fora da tela para economizar memória
      
      // Layout otimizado
      getItemLayout={(_: any, index: number) => ({
        length: height,
        offset: height * index,
        index,
      })}
    />
  );
};

const styles = StyleSheet.create({
    fullScreenCentered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black', gap: theme.spacing.m },
    loadingText: { ...theme.typography.bodyMedium, color: 'white', marginTop: theme.spacing.s },
    endText: { ...theme.typography.titleMedium, color: 'white', textAlign: 'center' },
    endSubText: { ...theme.typography.bodyMedium, color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.s, textAlign: 'center', paddingHorizontal: theme.spacing.l },
})

export default WatchFeed;
