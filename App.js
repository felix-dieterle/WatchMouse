import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Modal,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorBoundary } from 'react-error-boundary';
import { AIService } from './src/services/AIService';
import { BatchSearchService } from './src/services/BatchSearchService';
import { SettingsService } from './src/services/SettingsService';
import Settings from './src/components/Settings';
import LogView from './src/components/LogView';
import { logger } from './src/utils/logger';

// Start capturing console output so all service logs appear in the in-app log view
logger.interceptConsole();
import { 
  STORAGE_KEYS, 
  SORT_OPTIONS, 
  FILTER_OPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_SETTINGS,
  APP_VERSION,
  BUILD_NUMBER,
} from './src/constants';

/**
 * Error Fallback Component
 * Displays when an unhandled error occurs in the app
 */
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>
          {error.message || 'An unexpected error occurred'}
        </Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={resetErrorBoundary}
        >
          <Text style={styles.errorButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppContent() {
  const [searches, setSearches] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [newSearchQuery, setNewSearchQuery] = useState('');
  const [newSearchMaxPrice, setNewSearchMaxPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSplash, setShowSplash] = useState(true);
  
  // Search and filter states
  const [searchFilter, setSearchFilter] = useState('');
  const [matchFilter, setMatchFilter] = useState('');
  const [searchSort, setSearchSort] = useState(SORT_OPTIONS.SEARCHES.DATE_DESC);
  const [matchSort, setMatchSort] = useState(SORT_OPTIONS.MATCHES.DATE_DESC);
  const [platformFilter, setPlatformFilter] = useState(FILTER_OPTIONS.PLATFORM.ALL);
  const [readFilter, setReadFilter] = useState(FILTER_OPTIONS.READ_STATUS.ALL);

  useEffect(() => {
    loadSettings();
    loadSearches();
    loadMatches();
    const splashTimer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(splashTimer);
  }, []);

  // Load settings from storage
  const loadSettings = useCallback(async () => {
    const loadedSettings = await SettingsService.loadSettings();
    setSettings(loadedSettings);
  }, []);

  // Handle settings changes
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  // Load searches from AsyncStorage
  const loadSearches = useCallback(async () => {
    try {
      const savedSearches = await AsyncStorage.getItem(STORAGE_KEYS.SEARCHES);
      if (savedSearches) {
        setSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Error loading searches:', error);
    }
  }, []);

  // Load matches from AsyncStorage with migration
  const loadMatches = useCallback(async () => {
    try {
      const savedMatches = await AsyncStorage.getItem(STORAGE_KEYS.MATCHES);
      if (savedMatches) {
        const matches = JSON.parse(savedMatches);
        // Migration: add isRead property to existing matches that don't have it
        const migratedMatches = matches.map(m => ({
          ...m,
          isRead: m.isRead !== undefined ? m.isRead : false
        }));
        setMatches(migratedMatches);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  }, []);

  // Save searches to AsyncStorage
  const saveSearches = useCallback(async (newSearches) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SEARCHES, JSON.stringify(newSearches));
      setSearches(newSearches);
    } catch (error) {
      console.error('Error saving searches:', error);
    }
  }, []);

  // Save matches to AsyncStorage
  const saveMatches = useCallback(async (newMatches) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(newMatches));
      setMatches(newMatches);
    } catch (error) {
      console.error('Error saving matches:', error);
    }
  }, []);

  // Add new search
  const addSearch = useCallback(() => {
    if (!newSearchQuery.trim()) {
      Alert.alert('Error', ERROR_MESSAGES.EMPTY_QUERY);
      return;
    }

    const newSearch = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      query: newSearchQuery,
      maxPrice: newSearchMaxPrice ? parseFloat(newSearchMaxPrice) : null,
      createdAt: new Date().toISOString(),
    };

    const updatedSearches = [...searches, newSearch];
    saveSearches(updatedSearches);
    setNewSearchQuery('');
    setNewSearchMaxPrice('');
    setShowAddSearch(false);
    
    // Automatically run the search after adding it
    runSearch(newSearch);
  }, [newSearchQuery, newSearchMaxPrice, searches, saveSearches, runSearch]);

  // Delete search
  const deleteSearch = useCallback((searchId) => {
    const updatedSearches = searches.filter(s => s.id !== searchId);
    saveSearches(updatedSearches);
  }, [searches, saveSearches]);

  // Clear all matches
  const clearAllMatches = useCallback(() => {
    Alert.alert(
      'Clear All Matches',
      'Are you sure you want to clear all matches?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: () => saveMatches([]) },
      ]
    );
  }, [saveMatches]);

  // Toggle read status of a match
  const toggleMatchRead = useCallback((matchId) => {
    const updatedMatches = matches.map(m => 
      m.id === matchId ? { ...m, isRead: !m.isRead } : m
    );
    saveMatches(updatedMatches);
  }, [matches, saveMatches]);

  // Mark all matches as read
  const markAllAsRead = useCallback(() => {
    const updatedMatches = matches.map(m => ({ ...m, isRead: true }));
    saveMatches(updatedMatches);
  }, [matches, saveMatches]);

  // Open URL in browser
  const openUrl = useCallback(async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Failed to open link');
    }
  }, []);

  // Filter and sort searches - memoized for performance
  const getFilteredAndSortedSearches = useMemo(() => {
    let filtered = searches;
    
    // Apply search filter
    if (searchFilter.trim()) {
      const filterLower = searchFilter.toLowerCase();
      filtered = filtered.filter(s => 
        s.query.toLowerCase().includes(filterLower)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (searchSort) {
        case SORT_OPTIONS.SEARCHES.DATE_ASC:
          return new Date(a.createdAt) - new Date(b.createdAt);
        case SORT_OPTIONS.SEARCHES.DATE_DESC:
          return new Date(b.createdAt) - new Date(a.createdAt);
        case SORT_OPTIONS.SEARCHES.NAME_ASC:
          return a.query.localeCompare(b.query);
        case SORT_OPTIONS.SEARCHES.NAME_DESC:
          return b.query.localeCompare(a.query);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [searches, searchFilter, searchSort]);

  // Filter and sort matches - memoized for performance
  const getFilteredAndSortedMatches = useMemo(() => {
    let filtered = matches;
    
    // Apply platform filter
    if (platformFilter !== FILTER_OPTIONS.PLATFORM.ALL) {
      filtered = filtered.filter(m => m.platform === platformFilter);
    }
    
    // Apply read/unread filter
    if (readFilter !== FILTER_OPTIONS.READ_STATUS.ALL) {
      filtered = filtered.filter(m => 
        readFilter === FILTER_OPTIONS.READ_STATUS.UNREAD ? !m.isRead : m.isRead
      );
    }
    
    // Apply search filter
    if (matchFilter.trim()) {
      const filterLower = matchFilter.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(filterLower)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (matchSort) {
        case SORT_OPTIONS.MATCHES.DATE_ASC:
          return new Date(a.foundAt) - new Date(b.foundAt);
        case SORT_OPTIONS.MATCHES.DATE_DESC:
          return new Date(b.foundAt) - new Date(a.foundAt);
        case SORT_OPTIONS.MATCHES.PRICE_ASC:
          return a.price - b.price;
        case SORT_OPTIONS.MATCHES.PRICE_DESC:
          return b.price - a.price;
        case SORT_OPTIONS.MATCHES.TITLE_ASC:
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [matches, platformFilter, readFilter, matchFilter, matchSort]);

  // Validate API keys before running search
  const validateApiKeys = useCallback(() => {
    const hasEbayApi = settings.ebayApiKey && settings.ebayApiKey.trim().length > 0;
    const hasGoogleApi = settings.googleApiKey && settings.googleApiKey.trim().length > 0 && 
                         settings.googleCx && settings.googleCx.trim().length > 0;
    
    // Check if any enabled platform has API access
    const canSearchEbay = settings.ebayEnabled && (hasEbayApi || hasGoogleApi);
    const canSearchUsedCars = settings.usedCarsEnabled && hasGoogleApi;
    
    // Kleinanzeigen is always disabled since it has no API
    const hasAnyApiAccess = canSearchEbay || canSearchUsedCars;
    
    if (!hasAnyApiAccess) {
      // Build a helpful message based on enabled platforms
      let message = 'No API keys configured. Please add API keys in Settings to enable searches.\n\n';
      
      if (settings.ebayEnabled) {
        message += '• eBay: Add eBay API key OR Google Custom Search credentials\n';
      }
      if (settings.usedCarsEnabled) {
        message += '• Used Cars: Add Google Custom Search credentials\n';
      }
      if (settings.kleinanzeigenEnabled) {
        message += '\nNote: Kleinanzeigen is not currently supported (no API available).';
      }
      
      Alert.alert(
        'API Keys Required',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => setShowSettings(true) }
        ]
      );
      return false;
    }
    
    // Warn if Kleinanzeigen is the only enabled platform
    if (settings.kleinanzeigenEnabled && !settings.ebayEnabled && !settings.usedCarsEnabled) {
      Alert.alert(
        'Platform Not Available',
        'Kleinanzeigen is not currently supported (no API available).\n\nPlease enable eBay or Used Cars in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => setShowSettings(true) }
        ]
      );
      return false;
    }
    
    return true;
  }, [settings, setShowSettings]);

  // Run all saved searches in batch
  const runAllSearches = useCallback(async () => {
    if (searches.length === 0) {
      Alert.alert('No Searches', 'Please add some searches first.');
      return;
    }

    // Validate API keys before running searches
    if (!validateApiKeys()) {
      return;
    }

    setIsLoading(true);
    try {
      // Use BatchSearchService for optimized batch searching
      const batchService = new BatchSearchService(settings);
      
      console.log(`Running ${searches.length} searches in batch...`);
      
      // Run all searches with existing matches to avoid duplicates
      const result = await batchService.runBatchSearch(searches, matches);
      
      // Save new matches
      const updatedMatches = [...matches, ...result.matches];
      saveMatches(updatedMatches);
      
      // Determine if AI was used
      const aiService = new AIService(settings.openrouterApiKey);
      const aiEnabled = aiService.hasValidApiKey();
      
      // Show detailed results
      const message = `Found ${result.matches.length} new matches!\n\n` +
        `Successful: ${result.stats.successful}\n` +
        `Failed: ${result.stats.failed}\n` +
        `API calls saved: ${result.stats.apiCallsSaved}\n\n` +
        `Mode: ${aiEnabled ? 'AI-powered' : 'Keyword matching'}`;
      
      Alert.alert('Batch Search Complete', message);
    } catch (error) {
      console.error('Error running batch search:', error);
      Alert.alert('Error', 'Failed to run batch search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searches, settings, matches, saveMatches, validateApiKeys]);

  // Run search for a specific query
  const runSearch = useCallback(async (search) => {
    // Validate API keys before running search
    if (!validateApiKeys()) {
      return;
    }

    setIsLoading(true);
    const aiService = new AIService(settings.openrouterApiKey);
    const aiEnabled = aiService.hasValidApiKey();
    console.log(`runSearch: "${search.query}"${search.maxPrice ? ` (max €${search.maxPrice})` : ''} | mode: ${aiEnabled ? 'AI' : 'keyword'} | eBay: ${settings.ebayEnabled ? 'on' : 'off'} | usedCars: ${settings.usedCarsEnabled ? 'on' : 'off'}`);
    try {
      // Use BatchSearchService for optimized searching
      const batchService = new BatchSearchService(settings);
      
      // Run single search with existing matches to avoid duplicates
      const newMatches = await batchService.runSingleSearch(search, matches);
      
      console.log(`runSearch: "${search.query}" → ${newMatches.length} new match(es)`);
      if (newMatches.length === 0) {
        console.warn(`runSearch: 0 matches for "${search.query}" – check logs above for details`);
      }

      // Save new matches
      const updatedMatches = [...matches, ...newMatches];
      saveMatches(updatedMatches);
      
      Alert.alert('Success', SUCCESS_MESSAGES.SEARCH_COMPLETE(newMatches.length, aiEnabled));
    } catch (error) {
      console.error('Error running search:', error);
      Alert.alert('Error', ERROR_MESSAGES.SEARCH_FAILED);
    } finally {
      setIsLoading(false);
    }
  }, [settings, matches, saveMatches, validateApiKeys]);

  // Render item for search list - memoized
  const renderSearchItem = useCallback(({ item }) => (
    <View style={styles.searchItem}>
      <View style={styles.searchInfo}>
        <Text style={styles.searchQuery}>{item.query}</Text>
        {item.maxPrice && (
          <Text style={styles.searchPrice}>Max: €{item.maxPrice}</Text>
        )}
      </View>
      <View style={styles.searchActions}>
        <TouchableOpacity
          style={styles.runButton}
          onPress={() => runSearch(item)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Run</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteSearch(item.id)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [runSearch, deleteSearch, isLoading]);

  // Render item for match list - memoized
  const renderMatchItem = useCallback(({ item }) => (
    <View style={[styles.matchItem, item.isRead && styles.matchItemRead]}>
      <View style={styles.matchContent}>
        <Text style={[styles.matchTitle, item.isRead && styles.matchTitleRead]}>
          {item.title}
        </Text>
        <Text style={styles.matchPrice}>€{item.price}</Text>
        <Text style={styles.matchPlatform}>{item.platform}</Text>
        <Text style={styles.matchDate}>
          Found: {new Date(item.foundAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.matchActions}>
        <TouchableOpacity
          style={styles.openLinkButton}
          onPress={() => openUrl(item.url)}
        >
          <Text style={styles.openLinkButtonText}>🔗 Open Link</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.readToggleButton}
          onPress={() => toggleMatchRead(item.id)}
        >
          <Text style={styles.readToggleText}>
            {item.isRead ? '✓ Read' : '○ Mark Read'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [toggleMatchRead, openUrl]);

  // Calculate unread count - memoized
  const unreadCount = useMemo(() => {
    return matches.filter(m => !m.isRead).length;
  }, [matches]);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {showSplash && (
        <View style={styles.splashOverlay}>
          <Text style={styles.splashTitle}>4You WatchMouse</Text>
          <Text style={styles.splashSubtitle}>Shopping Deal Monitor</Text>
          <Text style={styles.splashVersion}>v{APP_VERSION} (Build {BUILD_NUMBER})</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>4You WatchMouse</Text>
            <Text style={styles.subtitle}>Shopping Deal Monitor</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowLogs(true)}
              accessibilityLabel="View logs"
              accessibilityRole="button"
            >
              <Text style={styles.settingsButtonText}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>
        {(!settings.openrouterApiKey || !settings.openrouterApiKey.trim()) && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠ No API key - Using basic keyword matching</Text>
          </View>
        )}
      </View>

      <Modal
        visible={showSettings}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <Settings
          onClose={() => setShowSettings(false)}
          onSettingsChange={handleSettingsChange}
        />
      </Modal>

      <LogView
        visible={showLogs}
        onClose={() => setShowLogs(false)}
      />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Searches ({searches.length})</Text>
            <View style={styles.headerButtons}>
              {searches.length > 0 && (
                <TouchableOpacity
                  style={[styles.addButton, styles.runAllButton]}
                  onPress={runAllSearches}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Running...' : 'Run All'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddSearch(!showAddSearch)}
              >
                <Text style={styles.buttonText}>
                  {showAddSearch ? 'Cancel' : 'Add Search'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showAddSearch && (
            <View style={styles.addSearchForm}>
              <TextInput
                style={styles.input}
                placeholder="Search query (e.g., 'iPhone 13')"
                value={newSearchQuery}
                onChangeText={setNewSearchQuery}
              />
              <TextInput
                style={styles.input}
                placeholder="Max price (optional)"
                value={newSearchMaxPrice}
                onChangeText={setNewSearchMaxPrice}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.submitButton} onPress={addSearch}>
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search filter and sort */}
          <View style={styles.filterSection}>
            <TextInput
              style={styles.filterInput}
              placeholder="Filter searches..."
              value={searchFilter}
              onChangeText={setSearchFilter}
            />
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, searchSort === SORT_OPTIONS.SEARCHES.DATE_DESC && styles.sortButtonActive]}
                onPress={() => setSearchSort(SORT_OPTIONS.SEARCHES.DATE_DESC)}
              >
                <Text style={[styles.sortButtonText, searchSort === SORT_OPTIONS.SEARCHES.DATE_DESC && styles.sortButtonTextActive]}>Newest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, searchSort === SORT_OPTIONS.SEARCHES.DATE_ASC && styles.sortButtonActive]}
                onPress={() => setSearchSort(SORT_OPTIONS.SEARCHES.DATE_ASC)}
              >
                <Text style={[styles.sortButtonText, searchSort === SORT_OPTIONS.SEARCHES.DATE_ASC && styles.sortButtonTextActive]}>Oldest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, searchSort === SORT_OPTIONS.SEARCHES.NAME_ASC && styles.sortButtonActive]}
                onPress={() => setSearchSort(SORT_OPTIONS.SEARCHES.NAME_ASC)}
              >
                <Text style={[styles.sortButtonText, searchSort === SORT_OPTIONS.SEARCHES.NAME_ASC && styles.sortButtonTextActive]}>A-Z</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={getFilteredAndSortedSearches}
            renderItem={renderSearchItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchFilter ? 'No searches match your filter' : 'No saved searches yet'}
              </Text>
            }
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recent Matches ({matches.length})
              {unreadCount > 0 && ` · ${unreadCount} unread`}
            </Text>
            {matches.length > 0 && (
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.markAllReadButton}
                  onPress={markAllAsRead}
                >
                  <Text style={styles.buttonText}>Mark All Read</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearAllMatches}
                >
                  <Text style={styles.buttonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Match filter and sort */}
          <View style={styles.filterSection}>
            <TextInput
              style={styles.filterInput}
              placeholder="Filter matches..."
              value={matchFilter}
              onChangeText={setMatchFilter}
            />
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, platformFilter === FILTER_OPTIONS.PLATFORM.ALL && styles.sortButtonActive]}
                onPress={() => setPlatformFilter(FILTER_OPTIONS.PLATFORM.ALL)}
              >
                <Text style={[styles.sortButtonText, platformFilter === FILTER_OPTIONS.PLATFORM.ALL && styles.sortButtonTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, platformFilter === FILTER_OPTIONS.PLATFORM.EBAY && styles.sortButtonActive]}
                onPress={() => setPlatformFilter(FILTER_OPTIONS.PLATFORM.EBAY)}
              >
                <Text style={[styles.sortButtonText, platformFilter === FILTER_OPTIONS.PLATFORM.EBAY && styles.sortButtonTextActive]}>eBay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, platformFilter === FILTER_OPTIONS.PLATFORM.KLEINANZEIGEN && styles.sortButtonActive]}
                onPress={() => setPlatformFilter(FILTER_OPTIONS.PLATFORM.KLEINANZEIGEN)}
              >
                <Text style={[styles.sortButtonText, platformFilter === FILTER_OPTIONS.PLATFORM.KLEINANZEIGEN && styles.sortButtonTextActive]}>Klein.</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, readFilter === FILTER_OPTIONS.READ_STATUS.ALL && styles.sortButtonActive]}
                onPress={() => setReadFilter(FILTER_OPTIONS.READ_STATUS.ALL)}
              >
                <Text style={[styles.sortButtonText, readFilter === FILTER_OPTIONS.READ_STATUS.ALL && styles.sortButtonTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, readFilter === FILTER_OPTIONS.READ_STATUS.UNREAD && styles.sortButtonActive]}
                onPress={() => setReadFilter(FILTER_OPTIONS.READ_STATUS.UNREAD)}
              >
                <Text style={[styles.sortButtonText, readFilter === FILTER_OPTIONS.READ_STATUS.UNREAD && styles.sortButtonTextActive]}>Unread</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, readFilter === FILTER_OPTIONS.READ_STATUS.READ && styles.sortButtonActive]}
                onPress={() => setReadFilter(FILTER_OPTIONS.READ_STATUS.READ)}
              >
                <Text style={[styles.sortButtonText, readFilter === FILTER_OPTIONS.READ_STATUS.READ && styles.sortButtonTextActive]}>Read</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, matchSort === SORT_OPTIONS.MATCHES.DATE_DESC && styles.sortButtonActive]}
                onPress={() => setMatchSort(SORT_OPTIONS.MATCHES.DATE_DESC)}
              >
                <Text style={[styles.sortButtonText, matchSort === SORT_OPTIONS.MATCHES.DATE_DESC && styles.sortButtonTextActive]}>Newest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, matchSort === SORT_OPTIONS.MATCHES.PRICE_ASC && styles.sortButtonActive]}
                onPress={() => setMatchSort(SORT_OPTIONS.MATCHES.PRICE_ASC)}
              >
                <Text style={[styles.sortButtonText, matchSort === SORT_OPTIONS.MATCHES.PRICE_ASC && styles.sortButtonTextActive]}>Price ↑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, matchSort === SORT_OPTIONS.MATCHES.PRICE_DESC && styles.sortButtonActive]}
                onPress={() => setMatchSort(SORT_OPTIONS.MATCHES.PRICE_DESC)}
              >
                <Text style={[styles.sortButtonText, matchSort === SORT_OPTIONS.MATCHES.PRICE_DESC && styles.sortButtonTextActive]}>Price ↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, matchSort === SORT_OPTIONS.MATCHES.TITLE_ASC && styles.sortButtonActive]}
                onPress={() => setMatchSort(SORT_OPTIONS.MATCHES.TITLE_ASC)}
              >
                <Text style={[styles.sortButtonText, matchSort === SORT_OPTIONS.MATCHES.TITLE_ASC && styles.sortButtonTextActive]}>A-Z</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={getFilteredAndSortedMatches}
            renderItem={renderMatchItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {matchFilter || platformFilter !== FILTER_OPTIONS.PLATFORM.ALL || readFilter !== FILTER_OPTIONS.READ_STATUS.ALL
                  ? 'No matches match your filter' 
                  : 'No matches found yet'}
              </Text>
            }
          />
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Main App component wrapped with ErrorBoundary
 * Catches and handles unhandled errors to prevent full app crashes
 */
export default function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset app state or reload - for now just remount
        console.log('Error boundary reset');
      }}
      onError={(error, errorInfo) => {
        // Log error to console or error tracking service
        console.error('ErrorBoundary caught an error:', error, errorInfo);
      }}
    >
      <AppContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  splashSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  splashVersion: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  settingsButton: {
    padding: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 28,
  },
  warningBanner: {
    backgroundColor: '#ff9800',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  warningText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    flexShrink: 1, // Allow text to shrink if needed
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  runAllButton: {
    backgroundColor: '#2196F3',
    marginRight: 8,
  },
  addSearchForm: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInfo: {
    flex: 1,
  },
  searchQuery: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  searchPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchActions: {
    flexDirection: 'row',
    marginLeft: -4,
  },
  runButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginLeft: 4,
  },
  matchItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  matchPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  matchPlatform: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: 15,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
    marginLeft: -4,
    marginRight: -4,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginLeft: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  sortButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  markAllReadButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 8,
  },
  matchItemRead: {
    backgroundColor: '#f9f9f9',
    opacity: 0.7,
  },
  matchTitleRead: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  matchContent: {
    flex: 1,
  },
  matchActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  openLinkButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  openLinkButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  readToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4CAF50',
    flex: 1,
    alignItems: 'center',
  },
  readToggleText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  // Error Boundary styles
  errorContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 400,
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 5,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
