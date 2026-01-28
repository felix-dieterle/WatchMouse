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
      
      // Load API key securely from SecureStore
      try {
        const secureApiKey = await SecureStore.getItemAsync(STORAGE_KEYS.SECURE_OPENROUTER_KEY);
        settings.openrouterApiKey = secureApiKey || '';
      } catch (secureError) {
        console.error('Error loading API key from SecureStore:', secureError);
        settings.openrouterApiKey = '';
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
      // Extract API key for secure storage
      const { openrouterApiKey, ...nonSensitiveSettings } = settings;
      
      // Save non-sensitive settings to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(nonSensitiveSettings));
      
      // Save API key securely to SecureStore
      if (openrouterApiKey) {
        await SecureStore.setItemAsync(STORAGE_KEYS.SECURE_OPENROUTER_KEY, openrouterApiKey);
      } else {
        // Delete the key if it's empty
        try {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.SECURE_OPENROUTER_KEY);
        } catch (deleteError) {
          // Ignore errors when deleting non-existent keys
          console.log('No secure key to delete or deletion failed:', deleteError.message);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },
};
