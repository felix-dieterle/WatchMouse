import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchService } from './src/services/SearchService';
import { AIService } from './src/services/AIService';
import { SettingsService } from './src/services/SettingsService';
import Settings from './src/components/Settings';

export default function App() {
  const [searches, setSearches] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newSearchQuery, setNewSearchQuery] = useState('');
  const [newSearchMaxPrice, setNewSearchMaxPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    openrouterApiKey: '',
    ebayEnabled: true,
    kleinanzeigenEnabled: true,
  });
  
  // Search and filter states
  const [searchFilter, setSearchFilter] = useState('');
  const [matchFilter, setMatchFilter] = useState('');
  const [searchSort, setSearchSort] = useState('date-desc'); // date-desc, date-asc, name-asc, name-desc
  const [matchSort, setMatchSort] = useState('date-desc'); // date-desc, date-asc, price-asc, price-desc, title-asc
  const [platformFilter, setPlatformFilter] = useState('all'); // all, eBay, Kleinanzeigen
  const [readFilter, setReadFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    loadSettings();
    loadSearches();
    loadMatches();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await SettingsService.loadSettings();
    setSettings(loadedSettings);
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  const loadSearches = async () => {
    try {
      const savedSearches = await AsyncStorage.getItem('searches');
      if (savedSearches) {
        setSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Error loading searches:', error);
    }
  };

  const loadMatches = async () => {
    try {
      const savedMatches = await AsyncStorage.getItem('matches');
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
  };

  const saveSearches = async (newSearches) => {
    try {
      await AsyncStorage.setItem('searches', JSON.stringify(newSearches));
      setSearches(newSearches);
    } catch (error) {
      console.error('Error saving searches:', error);
    }
  };

  const saveMatches = async (newMatches) => {
    try {
      await AsyncStorage.setItem('matches', JSON.stringify(newMatches));
      setMatches(newMatches);
    } catch (error) {
      console.error('Error saving matches:', error);
    }
  };

  const addSearch = () => {
    if (!newSearchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search query');
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
  };

  const deleteSearch = (searchId) => {
    const updatedSearches = searches.filter(s => s.id !== searchId);
    saveSearches(updatedSearches);
  };

  const clearAllMatches = () => {
    Alert.alert(
      'Clear All Matches',
      'Are you sure you want to clear all matches?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: () => saveMatches([]) },
      ]
    );
  };

  const toggleMatchRead = (matchId) => {
    const updatedMatches = matches.map(m => 
      m.id === matchId ? { ...m, isRead: !m.isRead } : m
    );
    saveMatches(updatedMatches);
  };

  const markAllAsRead = () => {
    const updatedMatches = matches.map(m => ({ ...m, isRead: true }));
    saveMatches(updatedMatches);
  };

  // Filter and sort searches
  const getFilteredAndSortedSearches = () => {
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
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'name-asc':
          return a.query.localeCompare(b.query);
        case 'name-desc':
          return b.query.localeCompare(a.query);
        default:
          return 0;
      }
    });
    
    return sorted;
  };

  // Filter and sort matches
  const getFilteredAndSortedMatches = () => {
    let filtered = matches;
    
    // Apply platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(m => m.platform === platformFilter);
    }
    
    // Apply read/unread filter
    if (readFilter !== 'all') {
      filtered = filtered.filter(m => 
        readFilter === 'unread' ? !m.isRead : m.isRead
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
        case 'date-asc':
          return new Date(a.foundAt) - new Date(b.foundAt);
        case 'date-desc':
          return new Date(b.foundAt) - new Date(a.foundAt);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'title-asc':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return sorted;
  };

  const runSearch = async (search) => {
    setIsLoading(true);
    try {
      // Create SearchService with platform settings
      const searchService = new SearchService({
        ebayEnabled: settings.ebayEnabled,
        kleinanzeigenEnabled: settings.kleinanzeigenEnabled,
      });
      const results = await searchService.searchAllPlatforms(search.query, search.maxPrice);
      
      // Filter results using AI (with API key from settings)
      const aiService = new AIService(settings.openrouterApiKey);
      const matchedResults = await aiService.filterMatches(search.query, results);
      
      // Save new matches
      const newMatches = matchedResults.map(result => ({
        ...result,
        searchId: search.id,
        foundAt: new Date().toISOString(),
        isRead: false, // Mark new matches as unread
      }));
      
      const updatedMatches = [...matches, ...newMatches];
      saveMatches(updatedMatches);
      
      const aiEnabled = aiService.hasValidApiKey();
      const aiStatus = aiEnabled ? '(AI-powered)' : '(keyword matching)';
      Alert.alert('Success', `Found ${matchedResults.length} new matches! ${aiStatus}`);
    } catch (error) {
      console.error('Error running search:', error);
      Alert.alert('Error', 'Failed to run search. Please check your configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSearchItem = ({ item }) => (
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
  );

  const renderMatchItem = ({ item }) => (
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
      <TouchableOpacity
        style={styles.readToggleButton}
        onPress={() => toggleMatchRead(item.id)}
      >
        <Text style={styles.readToggleText}>
          {item.isRead ? '✓ Read' : '○ Mark Read'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Calculate counts for UI
  const unreadCount = matches.filter(m => !m.isRead).length;

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>WatchMouse</Text>
            <Text style={styles.subtitle}>Shopping Deal Monitor</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
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

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Searches ({searches.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddSearch(!showAddSearch)}
            >
              <Text style={styles.buttonText}>
                {showAddSearch ? 'Cancel' : 'Add Search'}
              </Text>
            </TouchableOpacity>
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
                style={[styles.sortButton, searchSort === 'date-desc' && styles.sortButtonActive]}
                onPress={() => setSearchSort('date-desc')}
              >
                <Text style={[styles.sortButtonText, searchSort === 'date-desc' && styles.sortButtonTextActive]}>Newest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, searchSort === 'date-asc' && styles.sortButtonActive]}
                onPress={() => setSearchSort('date-asc')}
              >
                <Text style={[styles.sortButtonText, searchSort === 'date-asc' && styles.sortButtonTextActive]}>Oldest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, searchSort === 'name-asc' && styles.sortButtonActive]}
                onPress={() => setSearchSort('name-asc')}
              >
                <Text style={[styles.sortButtonText, searchSort === 'name-asc' && styles.sortButtonTextActive]}>A-Z</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={getFilteredAndSortedSearches()}
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
                style={[styles.sortButton, platformFilter === 'all' && styles.sortButtonActive]}
                onPress={() => setPlatformFilter('all')}
              >
                <Text style={[styles.sortButtonText, platformFilter === 'all' && styles.sortButtonTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, platformFilter === 'eBay' && styles.sortButtonActive]}
                onPress={() => setPlatformFilter('eBay')}
              >
                <Text style={[styles.sortButtonText, platformFilter === 'eBay' && styles.sortButtonTextActive]}>eBay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, platformFilter === 'Kleinanzeigen' && styles.sortButtonActive]}
                onPress={() => setPlatformFilter('Kleinanzeigen')}
              >
                <Text style={[styles.sortButtonText, platformFilter === 'Kleinanzeigen' && styles.sortButtonTextActive]}>Klein.</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, readFilter === 'all' && styles.sortButtonActive]}
                onPress={() => setReadFilter('all')}
              >
                <Text style={[styles.sortButtonText, readFilter === 'all' && styles.sortButtonTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, readFilter === 'unread' && styles.sortButtonActive]}
                onPress={() => setReadFilter('unread')}
              >
                <Text style={[styles.sortButtonText, readFilter === 'unread' && styles.sortButtonTextActive]}>Unread</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, readFilter === 'read' && styles.sortButtonActive]}
                onPress={() => setReadFilter('read')}
              >
                <Text style={[styles.sortButtonText, readFilter === 'read' && styles.sortButtonTextActive]}>Read</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, matchSort === 'date-desc' && styles.sortButtonActive]}
                onPress={() => setMatchSort('date-desc')}
              >
                <Text style={[styles.sortButtonText, matchSort === 'date-desc' && styles.sortButtonTextActive]}>Newest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, matchSort === 'price-asc' && styles.sortButtonActive]}
                onPress={() => setMatchSort('price-asc')}
              >
                <Text style={[styles.sortButtonText, matchSort === 'price-asc' && styles.sortButtonTextActive]}>Price ↑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, matchSort === 'price-desc' && styles.sortButtonActive]}
                onPress={() => setMatchSort('price-desc')}
              >
                <Text style={[styles.sortButtonText, matchSort === 'price-desc' && styles.sortButtonTextActive]}>Price ↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, matchSort === 'title-asc' && styles.sortButtonActive]}
                onPress={() => setMatchSort('title-asc')}
              >
                <Text style={[styles.sortButtonText, matchSort === 'title-asc' && styles.sortButtonTextActive]}>A-Z</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={getFilteredAndSortedMatches()}
            renderItem={renderMatchItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {matchFilter || platformFilter !== 'all' || readFilter !== 'all' 
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
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
  readToggleButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignSelf: 'flex-start',
  },
  readToggleText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
});
