import { SettingsService } from '../SettingsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Mocks are set up in jest.setup.js

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadSettings', () => {
    test('should load saved settings from AsyncStorage and SecureStore', async () => {
      const mockNonSensitiveSettings = {
        ebayEnabled: true,
        kleinanzeigenEnabled: false,
      };
      const mockApiKey = 'test-api-key';
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockNonSensitiveSettings));
      SecureStore.getItemAsync.mockResolvedValue(mockApiKey);
      
      const settings = await SettingsService.loadSettings();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_settings');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('secure_openrouter_api_key');
      expect(settings).toEqual({
        ...mockNonSensitiveSettings,
        openrouterApiKey: mockApiKey,
      });
    });

    test('should return default settings when no saved settings exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      SecureStore.getItemAsync.mockResolvedValue(null);
      
      const settings = await SettingsService.loadSettings();
      
      expect(settings).toEqual({
        openrouterApiKey: '',
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
      });
    });

    test('should return default settings on AsyncStorage error', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      SecureStore.getItemAsync.mockResolvedValue(null);
      
      const settings = await SettingsService.loadSettings();
      
      expect(settings).toEqual({
        openrouterApiKey: '',
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
      });
    });

    test('should handle SecureStore error gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
      }));
      SecureStore.getItemAsync.mockRejectedValue(new Error('SecureStore error'));
      
      const settings = await SettingsService.loadSettings();
      
      expect(settings.openrouterApiKey).toBe('');
      expect(settings.ebayEnabled).toBe(true);
      expect(settings.kleinanzeigenEnabled).toBe(true);
    });
  });

  describe('saveSettings', () => {
    test('should save settings to AsyncStorage and SecureStore', async () => {
      const settings = {
        openrouterApiKey: 'new-api-key',
        ebayEnabled: false,
        kleinanzeigenEnabled: true,
      };
      
      AsyncStorage.setItem.mockResolvedValue();
      SecureStore.setItemAsync.mockResolvedValue();
      
      const result = await SettingsService.saveSettings(settings);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_settings',
        JSON.stringify({
          ebayEnabled: false,
          kleinanzeigenEnabled: true,
        })
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'secure_openrouter_api_key',
        'new-api-key'
      );
      expect(result).toBe(true);
    });

    test('should delete API key from SecureStore when empty', async () => {
      const settings = {
        openrouterApiKey: '',
        ebayEnabled: true,
        kleinanzeigenEnabled: false,
      };
      
      AsyncStorage.setItem.mockResolvedValue();
      SecureStore.deleteItemAsync.mockResolvedValue();
      
      const result = await SettingsService.saveSettings(settings);
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('secure_openrouter_api_key');
      expect(result).toBe(true);
    });

    test('should return false on save error', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      const result = await SettingsService.saveSettings({ openrouterApiKey: 'key' });
      
      expect(result).toBe(false);
    });
  });
});
