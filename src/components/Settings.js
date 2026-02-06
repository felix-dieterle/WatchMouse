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
  const [ebayEnabled, setEbayEnabled] = useState(true);
  const [kleinanzeigenEnabled, setKleinanzeigenEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Rate limit states
  const [ebayRateLimit, setEbayRateLimit] = useState({ count: 0, limit: 5000, usagePercent: 0 });
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
      setEbayEnabled(settings.ebayEnabled !== undefined ? settings.ebayEnabled : true);
      setKleinanzeigenEnabled(settings.kleinanzeigenEnabled !== undefined ? settings.kleinanzeigenEnabled : true);
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
        ebayEnabled,
        kleinanzeigenEnabled,
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
