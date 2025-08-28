

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtp } from '../../context/AtpContext';
import {AppBskyActorDefs, AppBskyFeedDefs } from '@atproto/api';
import Feed from '../shared/Feed';
import { Search as SearchIcon, UserCircle, Image as ImageIcon, Video, TrendingUp, Clock, List, X } from 'lucide-react';
import ActorSearchResultCard from './ActorSearchResultCard';
import PopularFeeds from '../feeds/PopularFeeds';
import SuggestedFollows from '../profile/SuggestedFollows';
import { useSavedFeeds } from '../../hooks/useSavedFeeds';
import FeedSearchResultCard from '../feeds/FeedSearchResultCard';
import TrendingTopics from './TrendingTopics';
import Head from 'expo-router/head';
import { useDebounce, useDebouncedSearch } from '../../hooks/useDebounce';
import { useSearchHistory } from '../../hooks/useSearchHistory';
import { View, Text, TextInput, ScrollView, StyleSheet, ActivityIndicator, Pressable, Platform } from 'react-native';
import { useTheme } from '../shared/Theme/ThemeProvider';

type SearchResult = AppBskyActorDefs.ProfileView | AppBskyFeedDefs.GeneratorView;
type FilterType = 'top' | 'latest' | 'images' | 'videos' | 'people' | 'feeds';
type MediaFilter = 'all' | 'photos' | 'videos';


interface SearchScreenProps {
  initialQuery?: string;
  initialFilter?: string;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ initialQuery = '', initialFilter = 'top' }) => {
    const { agent, publicAgent, publicApiAgent, session } = useAtp();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [query, setQuery] = useState(initialQuery);
    const [nonPostResults, setNonPostResults] = useState<SearchResult[]>([]);
    const styles = useMemo(() => createStyles(theme), [theme]);
    
    // Use debounced search for optimized API calls
    const {
        query: debouncedQuery,
        isLoading
    } = useDebouncedSearch(() => Promise.resolve([]), 500);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(true);
    const { pinnedUris, togglePin, addFeed } = useSavedFeeds();
    const [activeFilter, setActiveFilter] = useState<FilterType>((initialFilter as FilterType) || 'top');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const { history, addHistoryItem, removeHistoryItem, clearHistory } = useSearchHistory();

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
            return { data: [], cursor: undefined, hasMore: false };
        }

        if (!currentCursor) {
            setNonPostResults([]);
            setCursor(undefined);
            setHasMore(true);
        } else {
            setIsLoadingMore(true);
        }
        
        try {
            // Desabilitar busca para usuários não logados
            if (!session) {
                console.log('🔒 DEBUG: Search disabled for non-authenticated users');
                setNonPostResults([]);
                return { data: [], cursor: undefined, hasMore: false };
            }
            
            console.log('🔍 DEBUG: Search using authenticated agent');
            
            if (searchFilter === 'people') {
                const response = await agent.app.bsky.actor.searchActors({ term: searchQuery, limit: 30, cursor: currentCursor });
                const newResults = currentCursor ? [...nonPostResults, ...response.data.actors] : response.data.actors;
                setNonPostResults(newResults);
                setCursor(response.data.cursor);
                setHasMore(!!response.data.cursor);
                return { data: newResults, cursor: response.data.cursor, hasMore: !!response.data.cursor };
            } else if (searchFilter === 'feeds') {
                console.log('🔍 DEBUG: Searching for feeds with query:', searchQuery);
                try {
                    const response = await (agent.api.app.bsky.unspecced as any).getPopularFeedGenerators({
                        query: searchQuery, limit: 25, cursor: currentCursor
                    });
                    console.log('✅ SUCCESS: Feed generators search completed, feeds found:', response.data.feeds?.length);
                    const newResults = currentCursor ? [...nonPostResults, ...response.data.feeds] : response.data.feeds;
                    setNonPostResults(newResults);
                    setCursor(response.data.cursor);
                    setHasMore(!!response.data.cursor);
                    return { data: newResults, cursor: response.data.cursor, hasMore: !!response.data.cursor };
                } catch (feedError: any) {
                    console.error('❌ ERROR: Feed generators search failed:', feedError);
                    // Fallback: try to get popular feeds without query
                    try {
                        const fallbackResponse = await (agent.api.app.bsky.unspecced as any).getPopularFeedGenerators({
                            limit: 25, cursor: currentCursor
                        });
                        console.log('🔄 FALLBACK: Using popular feeds without query, feeds found:', fallbackResponse.data.feeds?.length);
                        const newResults = currentCursor ? [...nonPostResults, ...fallbackResponse.data.feeds] : fallbackResponse.data.feeds;
                        setNonPostResults(newResults);
                        setCursor(fallbackResponse.data.cursor);
                        setHasMore(!!fallbackResponse.data.cursor);
                        return { data: newResults, cursor: fallbackResponse.data.cursor, hasMore: !!fallbackResponse.data.cursor };
                    } catch (fallbackError: any) {
                        console.error('❌ ERROR: Fallback feed generators also failed:', fallbackError);
                        throw fallbackError;
                    }
                }
            }
        } catch (error) {
            console.error("Search failed:", error);
            return { data: [], cursor: undefined, hasMore: false };
        } finally {
            setIsLoadingMore(false);
        }
        
        return { data: [], cursor: undefined, hasMore: false };
    }, [agent, session, isPostSearch, nonPostResults]);

    // Execute search when query or filter changes
    useEffect(() => {
        const effectiveQuery = query || initialQuery;
        if (effectiveQuery.trim()) {
            addHistoryItem(effectiveQuery);
            fetchNonPostResults(effectiveQuery, activeFilter);
        } else {
            setNonPostResults([]);
        }
    }, [query, initialQuery, activeFilter, addHistoryItem, fetchNonPostResults]);
    
    const handlePinToggle = useCallback((feed:AppBskyFeedDefs.GeneratorView) => {
        const isPinned = pinnedUris.has(feed.uri);
        if (isPinned) togglePin(feed.uri);
        else addFeed(feed, true);
    }, [pinnedUris, togglePin, addFeed]);
    
    const handleHistoryItemSelect = (term: string) => {
        setQuery(term);
        setIsInputFocused(false);
    };

    const handleHistoryItemRemove = (e: any, term: string) => {
        e.stopPropagation();
        removeHistoryItem(term);
    };

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
             {isLoadingMore && <ActivityIndicator size="large" style={{ marginVertical: theme.spacing.xxl }} color={theme.colors.onSurface} />}
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
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
                        />
                    </View>
                    {isInputFocused && history.length > 0 && !query.trim() && (
                        <View style={styles.historyDropdown}>
                            {history.map(item => (
                                <Pressable key={item} onPress={() => handleHistoryItemSelect(item)} style={styles.historyItem}>
                                    <Text style={styles.historyItemText}>{item}</Text>
                                    <Pressable onPress={(e) => handleHistoryItemRemove(e, item)} style={styles.historyRemoveButton}>
                                        <X size={16} color={theme.colors.onSurfaceVariant} />
                                    </Pressable>
                                </Pressable>
                            ))}
                            <Pressable onPress={clearHistory} style={styles.historyClearButton}>
                                <Text style={styles.historyClearButtonText}>{t('search.clearHistory')}</Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {showDiscoveryContent ? (
                    // Para usuários logados, mostrar conteúdo de descoberta quando não há busca
                    <ScrollView contentContainerStyle={styles.discoveryContainer}>
                        <TrendingTopics />
                        <SuggestedFollows />
                        <PopularFeeds />
                    </ScrollView>
                ) : (
                    // Para usuários logados, mostrar resultados de busca
                    <View style={{ flex: 1 }}>
                        <View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                                {filters.map(filter => (
                                    <Pressable key={filter.id} onPress={() => setActiveFilter(filter.id)} style={[styles.filterButton, activeFilter === filter.id && styles.activeFilterButton]}>
                                        <filter.icon size={16} color={activeFilter === filter.id ? theme.colors.background : theme.colors.onSurface} />
                                        <Text style={[styles.filterText, activeFilter === filter.id && styles.activeFilterText]}>{filter.label}</Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                        
                        <View style={{ flex: 1 }}>
                            {!isPostSearch && isLoading && (
                                <View style={{ gap: theme.spacing.m, paddingHorizontal: theme.spacing.l }}>
                                    {[...Array(5)].map((_, i) => <View key={i} style={styles.skeletonItemListView} />)}
                                </View>
                            )}
                            {(!isLoading || isPostSearch) && (debouncedQuery || initialQuery) && renderResults()}
                            {!isLoading && nonPostResults.length === 0 && !isPostSearch && (debouncedQuery || initialQuery) && <View style={styles.emptyContainer}><Text style={styles.emptyText}>{t('search.empty', { query: debouncedQuery || initialQuery })}</Text></View>}
                        </View>
                    </View>
                )}
            </View>
        </>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1 },
    stickyHeader: { padding: theme.spacing.l, backgroundColor: theme.colors.background, zIndex: 10 },
    inputContainer: { position: 'relative', justifyContent: 'center' },
    searchIcon: { position: 'absolute', left: theme.spacing.l, zIndex: 1 },
    input: { width: '100%', paddingLeft: 48, paddingRight: theme.spacing.l, paddingVertical: theme.spacing.m, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.radius.md, color: theme.colors.onSurface, fontSize: 16 },
    discoveryContainer: { padding: theme.spacing.l, gap: theme.spacing.xxl },
    filterContainer: { paddingHorizontal: theme.spacing.l, gap: theme.spacing.s, paddingBottom: theme.spacing.l, alignItems: 'center' },
    filterButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s, paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.s, borderRadius: theme.radius.full, backgroundColor: theme.colors.surfaceContainer },
    activeFilterButton: { backgroundColor: theme.colors.onSurface },
    filterText: { ...theme.typography.labelLarge, fontWeight: '500', color: theme.colors.onSurface },
    activeFilterText: { color: theme.colors.background, fontWeight: 'bold' },
    contentContainer: { paddingTop: theme.spacing.l, paddingHorizontal: theme.spacing.l },
    skeletonItemListView: { backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.radius.lg, height: 88, opacity: 0.5 },
    emptyContainer: { padding: theme.spacing.xxl, marginHorizontal: theme.spacing.l, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.radius.lg, marginTop: theme.spacing.l },
    emptyText: { color: theme.colors.onSurfaceVariant, textAlign: 'center' },
    endText: { textAlign: 'center', color: theme.colors.onSurfaceVariant, padding: theme.spacing.xxl },

    historyDropdown: {
        position: 'absolute',
        top: 72,
        left: theme.spacing.l,
        right: theme.spacing.l,
        backgroundColor: theme.colors.surfaceContainerHigh,
        borderRadius: theme.radius.md,
        zIndex: 100,
        ...Platform.select({
            web: {
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            },
            default: {
                elevation: 5,
            }
        }),
    },
    historyItem: {
        paddingVertical: theme.spacing.m,
        paddingHorizontal: theme.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyItemText: {
        color: theme.colors.onSurface,
        fontSize: 16,
    },
    historyRemoveButton: {
        padding: theme.spacing.xs,
    },
    historyClearButton: {
        padding: theme.spacing.m,
        alignItems: 'center',
    },
    historyClearButtonText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
});


export default SearchScreen;