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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SearchService } from './src/services/SearchService';
import { AIService } from './src/services/AIService';

export default function App() {
  const [searches, setSearches] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [newSearchQuery, setNewSearchQuery] = useState('');
  const [newSearchMaxPrice, setNewSearchMaxPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSearches();
    loadMatches();
  }, []);

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
        setMatches(JSON.parse(savedMatches));
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
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  const runSearch = async (search) => {
    setIsLoading(true);
    try {
      const searchService = new SearchService();
      const results = await searchService.searchAllPlatforms(search.query, search.maxPrice);
      
      // Filter results using AI
      const aiService = new AIService();
      const matchedResults = await aiService.filterMatches(search.query, results);
      
      // Save new matches
      const newMatches = matchedResults.map(result => ({
        ...result,
        searchId: search.id,
        foundAt: new Date().toISOString(),
      }));
      
      const updatedMatches = [...matches, ...newMatches];
      saveMatches(updatedMatches);
      
      Alert.alert('Success', `Found ${matchedResults.length} new matches!`);
    } catch (error) {
      console.error('Error running search:', error);
      Alert.alert('Error', 'Failed to run search. Please check your API configuration.');
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
    <View style={styles.matchItem}>
      <Text style={styles.matchTitle}>{item.title}</Text>
      <Text style={styles.matchPrice}>€{item.price}</Text>
      <Text style={styles.matchPlatform}>{item.platform}</Text>
      <Text style={styles.matchDate}>
        Found: {new Date(item.foundAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>WatchMouse</Text>
        <Text style={styles.subtitle}>Shopping Deal Monitor</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Searches</Text>
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

          <FlatList
            data={searches}
            renderItem={renderSearchItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No saved searches yet</Text>
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Matches</Text>
          <FlatList
            data={matches.slice(-10).reverse()}
            renderItem={renderMatchItem}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No matches found yet</Text>
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
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
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
    gap: 8,
  },
  runButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
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
});
