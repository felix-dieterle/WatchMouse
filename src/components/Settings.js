import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { SettingsService } from '../services/SettingsService';
import { SearchService } from '../services/SearchService';
import { AIService } from '../services/AIService';
import RateLimitIndicator from './RateLimitIndicator';

export default function Settings({ onClose, onSettingsChange }) {
  const [apiKey, setApiKey] = useState('');
  const [ebayApiKey, setEbayApiKey] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleCx, setGoogleCx] = useState('');
  const [ebayEnabled, setEbayEnabled] = useState(true);
  const [kleinanzeigenEnabled, setKleinanzeigenEnabled] = useState(true);
  const [useGoogleForEbay, setUseGoogleForEbay] = useState(false);
  const [usedCarsEnabled, setUsedCarsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Rate limit states
  const [ebayRateLimit, setEbayRateLimit] = useState({ count: 0, limit: 5000, usagePercent: 0 });
  const [googleRateLimit, setGoogleRateLimit] = useState({ count: 0, limit: 100, usagePercent: 0 });
  const [openRouterRateLimit, setOpenRouterRateLimit] = useState({ count: 0, limit: null, usagePercent: 0 });

  useEffect(() => {
    loadSettings();
    loadRateLimitStats();
  }, []);

  const loadRateLimitStats = async () => {
    try {
      // Load eBay rate limit stats
      const searchService = new SearchService();
      const ebayStats = await searchService.getEbayRateLimitStats();
      setEbayRateLimit({
        count: ebayStats.count,
        limit: ebayStats.limit,
        usagePercent: ebayStats.usagePercent,
      });

      // Load Google rate limit stats
      const googleStats = await searchService.getGoogleRateLimitStats();
      setGoogleRateLimit({
        count: googleStats.count,
        limit: googleStats.limit,
        usagePercent: googleStats.usagePercent,
      });

      // Load OpenRouter rate limit stats
      const openRouterStats = await AIService.getOpenRouterRateLimitStats();
      setOpenRouterRateLimit({
        count: openRouterStats.count,
        limit: openRouterStats.limit,
        usagePercent: 0, // No hard limit for OpenRouter
      });
    } catch (error) {
      console.error('Error loading rate limit stats:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await SettingsService.loadSettings();
      setApiKey(settings.openrouterApiKey || '');
      setEbayApiKey(settings.ebayApiKey || '');
      setGoogleApiKey(settings.googleApiKey || '');
      setGoogleCx(settings.googleCx || '');
      setEbayEnabled(settings.ebayEnabled !== undefined ? settings.ebayEnabled : true);
      setKleinanzeigenEnabled(settings.kleinanzeigenEnabled !== undefined ? settings.kleinanzeigenEnabled : true);
      setUseGoogleForEbay(settings.useGoogleForEbay === true);
      setUsedCarsEnabled(settings.usedCarsEnabled === true);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        openrouterApiKey: apiKey.trim(),
        ebayApiKey: ebayApiKey.trim(),
        googleApiKey: googleApiKey.trim(),
        googleCx: googleCx.trim(),
        ebayEnabled,
        kleinanzeigenEnabled,
        useGoogleForEbay,
        usedCarsEnabled,
      };
      
      const success = await SettingsService.saveSettings(settings);
      
      if (success) {
        // Notify parent component about settings change
        if (onSettingsChange) {
          onSettingsChange(settings);
        }
        Alert.alert('Success', 'Settings saved successfully!');
      } else {
        Alert.alert('Error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleSave = () => {
    saveSettings();
  };

  const handleEbayToggle = (value) => {
    if (!value && !kleinanzeigenEnabled) {
      Alert.alert('Error', 'At least one platform must be enabled');
      return;
    }
    setEbayEnabled(value);
  };

  const handleKleinanzeigenToggle = (value) => {
    if (!value && !ebayEnabled) {
      Alert.alert('Error', 'At least one platform must be enabled');
      return;
    }
    setKleinanzeigenEnabled(value);
  };

  const handleUsedCarsToggle = (value) => {
    // Check if Google credentials are available when enabling
    if (value && (!googleApiKey || !googleCx)) {
      Alert.alert(
        'Google API Required',
        'Used car search requires Google Custom Search API credentials. Please enter your Google API Key and Search Engine ID first.',
        [{ text: 'OK' }]
      );
      return;
    }
    setUsedCarsEnabled(value);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.closeButton}
          accessibilityLabel="Close settings"
          accessibilityRole="button"
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* API Key Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Configuration</Text>
          <Text style={styles.label}>OpenRouter API Key</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your OpenRouter API key"
            placeholderTextColor="#999"
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>
            Get your API key at: https://openrouter.ai/
          </Text>
          <Text style={styles.helperText}>
            {apiKey.trim() ? '✓ API key configured - AI features enabled' : '⚠ No API key - Using basic keyword matching'}
          </Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Choosing a Model</Text>
            <Text style={styles.infoText}>
              WatchMouse uses simple AI to match search results. Free models work great!
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Recommended free models:</Text>
            </Text>
            <Text style={styles.infoText}>
              • meta-llama/llama-3.2-3b-instruct:free (Best free option)
            </Text>
            <Text style={styles.infoText}>
              • google/gemini-flash-1.5:free (Fast and free)
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Current default:</Text> openai/gpt-3.5-turbo (~$0.10 per 1,000 searches)
            </Text>
            <Text style={styles.infoText}>
              See docs/OPENROUTER_MODEL_GUIDE.md for more options and how to change models.
            </Text>
            <Text style={[styles.infoText, { marginTop: 8 }]}>
              <Text style={styles.infoBold}>Browse models:</Text> https://openrouter.ai/collections/free-models
            </Text>
          </View>
        </View>

        {/* eBay API Key Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>eBay Configuration</Text>
          <Text style={styles.label}>eBay API Key</Text>
          <TextInput
            style={styles.input}
            value={ebayApiKey}
            onChangeText={setEbayApiKey}
            placeholder="Enter your eBay API key"
            placeholderTextColor="#999"
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>
            Get your API key at: https://developer.ebay.com/
          </Text>
          <Text style={styles.helperText}>
            {ebayApiKey.trim() ? '✓ API key configured - eBay search enabled' : '⚠ No API key - eBay search disabled'}
          </Text>
        </View>

        {/* Google Custom Search API Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Google Custom Search (eBay Fallback)</Text>
          <Text style={[styles.helperText, { marginBottom: 12 }]}>
            Use Google Custom Search API when eBay API key is not available. Requires both API Key and Search Engine ID.
          </Text>
          
          <Text style={styles.label}>Google API Key</Text>
          <TextInput
            style={styles.input}
            value={googleApiKey}
            onChangeText={setGoogleApiKey}
            placeholder="Enter your Google API key"
            placeholderTextColor="#999"
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>
            Get your API key at: https://console.cloud.google.com/
          </Text>
          
          <Text style={[styles.label, { marginTop: 12 }]}>Custom Search Engine ID (CX)</Text>
          <TextInput
            style={styles.input}
            value={googleCx}
            onChangeText={setGoogleCx}
            placeholder="Enter your Custom Search Engine ID"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>
            Create a search engine at: https://programmablesearchengine.google.com/
          </Text>
          
          <View style={[styles.switchContainer, { marginTop: 12 }]}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Use Google as eBay Fallback</Text>
              <Text style={styles.helperText}>Enable Google search when eBay API key is missing</Text>
            </View>
            <Switch
              value={useGoogleForEbay}
              onValueChange={setUseGoogleForEbay}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={useGoogleForEbay ? '#2196F3' : '#f4f3f4'}
              accessibilityLabel="Toggle Google fallback"
            />
          </View>
          
          <Text style={styles.helperText}>
            {(googleApiKey.trim() && googleCx.trim()) 
              ? '✓ Google API configured - Can be used as fallback' 
              : '⚠ Google API not fully configured'}
          </Text>
        </View>

        {/* Platform Modules Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Modules</Text>
          
          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>eBay</Text>
              <Text style={styles.helperText}>Search on eBay platform</Text>
            </View>
            <Switch
              value={ebayEnabled}
              onValueChange={handleEbayToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={ebayEnabled ? '#2196F3' : '#f4f3f4'}
              accessibilityLabel="Toggle eBay"
            />
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Kleinanzeigen</Text>
              <Text style={styles.helperText}>Search on Kleinanzeigen platform</Text>
            </View>
            <Switch
              value={kleinanzeigenEnabled}
              onValueChange={handleKleinanzeigenToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={kleinanzeigenEnabled ? '#2196F3' : '#f4f3f4'}
              accessibilityLabel="Toggle Kleinanzeigen"
            />
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Used Cars (mobile.de, AutoScout24)</Text>
              <Text style={styles.helperText}>Search used car platforms via Google (requires Google API)</Text>
            </View>
            <Switch
              value={usedCarsEnabled}
              onValueChange={handleUsedCarsToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={usedCarsEnabled ? '#2196F3' : '#f4f3f4'}
              accessibilityLabel="Toggle Used Cars"
              accessibilityHint={
                !googleApiKey || !googleCx
                  ? 'Disabled. Google Custom Search API credentials required.'
                  : 'Toggle used car search on mobile.de and AutoScout24'
              }
              disabled={!googleApiKey || !googleCx}
            />
          </View>

          {!ebayEnabled && !kleinanzeigenEnabled && (
            <Text style={styles.warningText}>
              ⚠ At least one platform should be enabled
            </Text>
          )}
        </View>

        {/* API Rate Limits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Rate Limits</Text>
          <Text style={styles.helperText} style={{ marginBottom: 12 }}>
            Daily API usage tracking (resets at midnight)
          </Text>
          
          <RateLimitIndicator
            apiName="eBay API"
            usagePercent={ebayRateLimit.usagePercent}
            count={ebayRateLimit.count}
            limit={ebayRateLimit.limit}
            enabled={ebayEnabled && ebayApiKey.trim() !== ''}
          />
          
          <RateLimitIndicator
            apiName="Google Custom Search"
            usagePercent={googleRateLimit.usagePercent}
            count={googleRateLimit.count}
            limit={googleRateLimit.limit}
            enabled={useGoogleForEbay && googleApiKey.trim() !== '' && googleCx.trim() !== ''}
          />
          
          <RateLimitIndicator
            apiName="OpenRouter AI"
            usagePercent={openRouterRateLimit.usagePercent}
            count={openRouterRateLimit.count}
            limit="N/A"
            enabled={apiKey.trim() !== ''}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, (!ebayEnabled && !kleinanzeigenEnabled) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!ebayEnabled && !kleinanzeigenEnabled}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginBottom: 5,
  },
  warningText: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff3e0',
    borderRadius: 5,
  },
  infoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  infoBold: {
    fontWeight: '600',
    color: '#1976d2',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLabel: {
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
