import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants';

export const SettingsService = {
  /**
   * Load settings from AsyncStorage and SecureStore
   * API keys are stored securely in SecureStore, other settings in AsyncStorage
   * @returns {Promise<Object>} Settings object
   */
  async loadSettings() {
    try {
      // Load non-sensitive settings from AsyncStorage
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      let settings = { ...DEFAULT_SETTINGS };
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        settings = {
          ...settings,
          ...parsed,
        };
      }
      
      // Load OpenRouter API key securely from SecureStore
      try {
        const secureApiKey = await SecureStore.getItemAsync(STORAGE_KEYS.SECURE_OPENROUTER_KEY);
        settings.openrouterApiKey = secureApiKey || '';
      } catch (secureError) {
        console.error('Error loading OpenRouter API key from SecureStore:', secureError);
        settings.openrouterApiKey = '';
      }
      
      // Load eBay API key securely from SecureStore
      try {
        const secureEbayKey = await SecureStore.getItemAsync(STORAGE_KEYS.SECURE_EBAY_KEY);
        settings.ebayApiKey = secureEbayKey || '';
      } catch (secureError) {
        console.error('Error loading eBay API key from SecureStore:', secureError);
        settings.ebayApiKey = '';
      }
      
      // Load Google API key securely from SecureStore
      try {
        const secureGoogleKey = await SecureStore.getItemAsync(STORAGE_KEYS.SECURE_GOOGLE_API_KEY);
        settings.googleApiKey = secureGoogleKey || '';
      } catch (secureError) {
        console.error('Error loading Google API key from SecureStore:', secureError);
        settings.googleApiKey = '';
      }
      
      // Load Google Custom Search Engine ID securely from SecureStore
      try {
        const secureGoogleCx = await SecureStore.getItemAsync(STORAGE_KEYS.SECURE_GOOGLE_CX);
        settings.googleCx = secureGoogleCx || '';
      } catch (secureError) {
        console.error('Error loading Google CX from SecureStore:', secureError);
        settings.googleCx = '';
      }

      // Load SerpAPI key securely from SecureStore
      try {
        const secureSerpApiKey = await SecureStore.getItemAsync(STORAGE_KEYS.SECURE_SERP_API_KEY);
        settings.serpApiKey = secureSerpApiKey || '';
      } catch (secureError) {
        console.error('Error loading SerpAPI key from SecureStore:', secureError);
        settings.serpApiKey = '';
      }
      
      return settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      // Return default settings on error
      return { ...DEFAULT_SETTINGS };
    }
  },

  /**
   * Save settings to AsyncStorage and SecureStore
   * API keys are stored securely in SecureStore, other settings in AsyncStorage
   * @param {Object} settings - Settings object to save
   */
  async saveSettings(settings) {
    try {
      // Extract API keys for secure storage
      const { 
        openrouterApiKey, 
        ebayApiKey, 
        googleApiKey, 
        googleCx,
        serpApiKey,
        ...nonSensitiveSettings 
      } = settings;
      
      // Save non-sensitive settings to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(nonSensitiveSettings));
      
      // Save OpenRouter API key securely to SecureStore
      if (openrouterApiKey) {
        await SecureStore.setItemAsync(STORAGE_KEYS.SECURE_OPENROUTER_KEY, openrouterApiKey);
      } else {
        // Delete the key if it's empty
        try {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.SECURE_OPENROUTER_KEY);
        } catch (deleteError) {
          // Ignore errors when deleting non-existent keys
          console.log('No secure OpenRouter key to delete or deletion failed:', deleteError.message);
        }
      }
      
      // Save eBay API key securely to SecureStore
      if (ebayApiKey) {
        await SecureStore.setItemAsync(STORAGE_KEYS.SECURE_EBAY_KEY, ebayApiKey);
      } else {
        // Delete the key if it's empty
        try {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.SECURE_EBAY_KEY);
        } catch (deleteError) {
          // Ignore errors when deleting non-existent keys
          console.log('No secure eBay key to delete or deletion failed:', deleteError.message);
        }
      }
      
      // Save Google API key securely to SecureStore
      if (googleApiKey) {
        await SecureStore.setItemAsync(STORAGE_KEYS.SECURE_GOOGLE_API_KEY, googleApiKey);
      } else {
        // Delete the key if it's empty
        try {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.SECURE_GOOGLE_API_KEY);
        } catch (deleteError) {
          // Ignore errors when deleting non-existent keys
          console.log('No secure Google API key to delete or deletion failed:', deleteError.message);
        }
      }
      
      // Save Google CX securely to SecureStore
      if (googleCx) {
        await SecureStore.setItemAsync(STORAGE_KEYS.SECURE_GOOGLE_CX, googleCx);
      } else {
        // Delete the key if it's empty
        try {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.SECURE_GOOGLE_CX);
        } catch (deleteError) {
          // Ignore errors when deleting non-existent keys
          console.log('No secure Google CX to delete or deletion failed:', deleteError.message);
        }
      }
      
      // Save SerpAPI key securely to SecureStore
      if (serpApiKey) {
        await SecureStore.setItemAsync(STORAGE_KEYS.SECURE_SERP_API_KEY, serpApiKey);
      } else {
        try {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.SECURE_SERP_API_KEY);
        } catch (deleteError) {
          console.log('No secure SerpAPI key to delete or deletion failed:', deleteError.message);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },
};
