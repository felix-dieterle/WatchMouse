import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'app_settings';
const SECURE_OPENROUTER_KEY = 'secure_openrouter_api_key';

export const SettingsService = {
  /**
   * Load settings from AsyncStorage and SecureStore
   * API keys are stored securely in SecureStore, other settings in AsyncStorage
   * @returns {Promise<Object>} Settings object
   */
  async loadSettings() {
    try {
      // Load non-sensitive settings from AsyncStorage
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      let settings = {
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
      };
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        settings = {
          ...settings,
          ...parsed,
        };
      }
      
      // Load API key securely from SecureStore
      try {
        const secureApiKey = await SecureStore.getItemAsync(SECURE_OPENROUTER_KEY);
        settings.openrouterApiKey = secureApiKey || '';
      } catch (secureError) {
        console.error('Error loading API key from SecureStore:', secureError);
        settings.openrouterApiKey = '';
      }
      
      return settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      // Return default settings on error
      return {
        openrouterApiKey: '',
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
      };
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
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(nonSensitiveSettings));
      
      // Save API key securely to SecureStore
      if (openrouterApiKey) {
        await SecureStore.setItemAsync(SECURE_OPENROUTER_KEY, openrouterApiKey);
      } else {
        // Delete the key if it's empty
        await SecureStore.deleteItemAsync(SECURE_OPENROUTER_KEY);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },
};
