import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'app_settings';

export const SettingsService = {
  /**
   * Load settings from AsyncStorage
   * @returns {Promise<Object>} Settings object
   */
  async loadSettings() {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
      
      // Return default settings
      return {
        openrouterApiKey: '',
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
      };
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
   * Save settings to AsyncStorage
   * @param {Object} settings - Settings object to save
   */
  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },
};
