import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import {AppBskyActorDefs, AppBskyFeedDefs } from '@atproto/api';
import Feed from '../shared/Feed';
import { Search as SearchIcon, UserCircle, Image as ImageIcon, Video, TrendingUp, Clock, List } from 'lucide-react';
import ActorSearchResultCard from './ActorSearchResultCard';
import PopularFeeds from '../feeds/PopularFeeds';
import SuggestedFollows from '../profile/SuggestedFollows';
import { useSavedFeeds } from '../../hooks/useSavedFeeds';
import FeedSearchResultCard from '../feeds/FeedSearchResultCard';
import TrendingTopics from './TrendingTopics';
import Head from '../shared/Head';
import { useDebounce } from '../../hooks/useDebounce';
import { View, Text, TextInput, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { theme } from '@/lib/theme';

type SearchResult = AppBskyActorDefs.ProfileView | AppBskyFeedDefs.GeneratorView;
type FilterType = 'top' | 'latest' | 'images' | 'videos' | 'people' | 'feeds';
type MediaFilter = 'all' | 'photos' | 'videos';


interface SearchScreenProps {
  initialQuery?: string;
  initialFilter?: string;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ initialQuery = '', initialFilter = 'top' }) => {
    const { agent } = useAtp();
    const { t } = useTranslation();
    const [query, setQuery] = useState(initialQuery);
    const debouncedQuery = useDebounce(query, 500);
    const [nonPostResults, setNonPostResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const { pinnedUris, togglePin, addFeed } = useSavedFeeds();
    const [activeFilter, setActiveFilter] = useState<FilterType>((initialFilter as FilterType) || 'top');

    const filters: { id: FilterType; label: string; icon: React.FC<any> }[] = [
      { id: 'top', label: t('search.top'), icon: TrendingUp },
      { id: 'latest', label: t('search.latest'), icon: Clock },
      { id: 'images', label: t('common.images'), icon: ImageIcon },
      { id: 'videos', label: t('common.videos'), icon: Video },
      { id: 'people', label: t('common.people'), icon: UserCircle },
      { id: 'feeds', label: t('common.feeds'), icon: List },
    ];
    
    const showDiscoveryContent = !debouncedQuery.trim() && !initialQuery.trim();
    const isPostSearch = ['top', 'latest', 'images', 'videos'].includes(activeFilter);

    const fetchNonPostResults = useCallback(async (searchQuery: string, searchFilter: FilterType, currentCursor?: string) => {
        if (!searchQuery.trim() || isPostSearch) {
            setNonPostResults([]);
            return;
        }

        if (!currentCursor) {
            setIsLoading(true);
            setNonPostResults([]);
            setCursor(undefined);
            setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }
        
        try {
            if (searchFilter === 'people') {
                const response = await agent.app.bsky.actor.searchActors({ term: searchQuery, limit: 30, cursor: currentCursor });
                setNonPostResults(prev => currentCursor ? [...prev, ...response.data.actors] : response.data.actors);
                setCursor(response.data.cursor);
                setHasMore(!!response.data.cursor);
            } else if (searchFilter === 'feeds') {
                const response = await (agent.api.app.bsky.unspecced as any).getPopularFeedGenerators({
                    query: searchQuery, limit: 25, cursor: currentCursor
                });
                setNonPostResults(prev => currentCursor ? [...prev, ...response.data.feeds] : response.data.feeds);
                setCursor(response.data.cursor);
                setHasMore(!!response.data.cursor);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [agent, isPostSearch]);

    useEffect(() => {
        const effectiveQuery = debouncedQuery || initialQuery;
        if (effectiveQuery.trim()) {
            fetchNonPostResults(effectiveQuery, activeFilter);
        } else {
            setNonPostResults([]);
            setIsLoading(false);
        }
    }, [debouncedQuery, initialQuery, activeFilter, fetchNonPostResults]);
    
    const handlePinToggle = useCallback((feed:AppBskyFeedDefs.GeneratorView) => {
        const isPinned = pinnedUris.has(feed.uri);
        if (isPinned) togglePin(feed.uri);
        else addFeed(feed, true);
    }, [pinnedUris, togglePin, addFeed]);
    
    const renderResults = () => {
      if (isPostSearch) {
          const mediaFilter: MediaFilter = activeFilter === 'images' ? 'photos' : activeFilter === 'videos' ? 'videos' : 'all';
          return (
            <Feed 
                key={activeFilter}
                searchQuery={debouncedQuery || initialQuery}
                searchSort={activeFilter === 'latest' ? 'latest' : 'top'}
                mediaFilter={mediaFilter}
                layout="grid"
            />
          );
      }
      return (
        <ScrollView onScroll={({ nativeEvent }) => { if (nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 400) fetchNonPostResults(debouncedQuery || initialQuery, activeFilter, cursor); }} scrollEventThrottle={16}>
          <View style={[styles.contentContainer, { gap: theme.spacing.m }]}>
            {nonPostResults.map(item => {
                if (activeFilter === 'people') return <ActorSearchResultCard key={(item as any).did} actor={item as any} />;
                if (activeFilter === 'feeds') return <FeedSearchResultCard key={(item as any).uri} feed={item as any} isPinned={pinnedUris.has((item as any).uri)} onTogglePin={() => handlePinToggle(item as any)} />;
                return null;
            })}
             {isLoadingMore && <ActivityIndicator size="large" style={{ marginVertical: theme.spacing.xxl }} />}
             {!isLoading && !hasMore && nonPostResults.length > 0 && <Text style={styles.endText}>{t('common.endOfList')}</Text>}
          </View>
        </ScrollView>
      );
    }
    
    return (
        <>
            <Head><title>{t('search.title')}</title></Head>
            <View style={styles.container}>
                <View style={styles.stickyHeader}>
                    <View style={styles.inputContainer}>
                        <SearchIcon style={styles.searchIcon} color={theme.colors.onSurfaceVariant} size={20} />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder={t('search.placeholder')}
                            placeholderTextColor={theme.colors.onSurfaceVariant}
                            style={styles.input}
                        />
                    </View>
                </View>

                {showDiscoveryContent ? (
                    <ScrollView contentContainerStyle={styles.discoveryContainer}>
                        <TrendingTopics />
                        <SuggestedFollows />
                        <PopularFeeds />
                    </ScrollView>
                ) : (
                    <View style={{ flex: 1 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                            {filters.map(filter => (
                                <Pressable key={filter.id} onPress={() => setActiveFilter(filter.id)} style={[styles.filterButton, activeFilter === filter.id && styles.activeFilterButton]}>
                                    <filter.icon size={16} color={activeFilter === filter.id ? theme.colors.background : theme.colors.onSurface} />
                                    <Text style={[styles.filterText, activeFilter === filter.id && styles.activeFilterText]}>{filter.label}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                        
                        {!isPostSearch && isLoading && (
                            <View style={{ gap: theme.spacing.m, paddingHorizontal: theme.spacing.l }}>
                                {[...Array(5)].map((_, i) => <View key={i} style={styles.skeletonItemListView} />)}
                            </View>
                        )}
                        {(!isLoading || isPostSearch) && (debouncedQuery || initialQuery) && renderResults()}
                        {!isLoading && nonPostResults.length === 0 && !isPostSearch && (debouncedQuery || initialQuery) && <View style={styles.emptyContainer}><Text style={styles.emptyText}>{t('search.empty', { query: debouncedQuery || initialQuery })}</Text></View>}
                    </View>
                )}
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    stickyHeader: { padding: theme.spacing.l, backgroundColor: theme.colors.background },
    inputContainer: { position: 'relative', justifyContent: 'center' },
    searchIcon: { position: 'absolute', left: theme.spacing.l, zIndex: 1 },
    input: { width: '100%', paddingLeft: 48, paddingRight: theme.spacing.l, paddingVertical: theme.spacing.m, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shape.medium, color: theme.colors.onSurface, fontSize: 16 },
    discoveryContainer: { padding: theme.spacing.l, gap: theme.spacing.xxl },
    filterContainer: { paddingHorizontal: theme.spacing.l, gap: theme.spacing.s, paddingBottom: theme.spacing.l },
    filterButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.s, borderRadius: theme.shape.full, backgroundColor: theme.colors.surfaceContainer },
    activeFilterButton: { backgroundColor: theme.colors.onSurface },
    filterText: { ...theme.typography.labelLarge, fontWeight: '500', color: theme.colors.onSurface },
    activeFilterText: { color: theme.colors.background, fontWeight: 'bold' },
    contentContainer: { paddingTop: theme.spacing.l, paddingHorizontal: theme.spacing.l },
    skeletonItemListView: { backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shape.large, height: 88, opacity: 0.5 },
    emptyContainer: { padding: theme.spacing.xxl, marginHorizontal: theme.spacing.l, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.shape.large, marginTop: theme.spacing.l },
    emptyText: { color: theme.colors.onSurfaceVariant, textAlign: 'center' },
    endText: { textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: theme.spacing.xxl },
});


export default SearchScreen;
