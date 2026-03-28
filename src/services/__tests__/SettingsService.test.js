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
      const mockOpenRouterApiKey = 'test-openrouter-key';
      const mockEbayApiKey = 'test-ebay-key';
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockNonSensitiveSettings));
      SecureStore.getItemAsync
        .mockResolvedValueOnce(mockOpenRouterApiKey)
        .mockResolvedValueOnce(mockEbayApiKey)
        .mockResolvedValueOnce(null) // googleApiKey
        .mockResolvedValueOnce(null) // googleCx
        .mockResolvedValueOnce(null); // serpApiKey
      
      const settings = await SettingsService.loadSettings();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_settings');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('secure_openrouter_api_key');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('secure_ebay_api_key');
      expect(settings).toEqual({
        ...mockNonSensitiveSettings,
        openrouterApiKey: mockOpenRouterApiKey,
        ebayApiKey: mockEbayApiKey,
        googleApiKey: '',
        googleCx: '',
        serpApiKey: '',
        useGoogleForEbay: false,
        usedCarsEnabled: false,
        primarySearchEngine: 'ebay_api',
      });
    });

    test('should return default settings when no saved settings exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      SecureStore.getItemAsync.mockResolvedValue(null);
      
      const settings = await SettingsService.loadSettings();
      
      expect(settings).toEqual({
        openrouterApiKey: '',
        ebayApiKey: '',
        googleApiKey: '',
        googleCx: '',
        serpApiKey: '',
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
        useGoogleForEbay: false,
        usedCarsEnabled: false,
        primarySearchEngine: 'ebay_api',
      });
    });

    test('should return default settings on AsyncStorage error', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      SecureStore.getItemAsync.mockResolvedValue(null);
      
      const settings = await SettingsService.loadSettings();
      
      expect(settings).toEqual({
        openrouterApiKey: '',
        ebayApiKey: '',
        googleApiKey: '',
        googleCx: '',
        serpApiKey: '',
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
        useGoogleForEbay: false,
        usedCarsEnabled: false,
        primarySearchEngine: 'ebay_api',
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
      expect(settings.ebayApiKey).toBe('');
      expect(settings.googleApiKey).toBe('');
      expect(settings.googleCx).toBe('');
      expect(settings.ebayEnabled).toBe(true);
      expect(settings.kleinanzeigenEnabled).toBe(true);
      expect(settings.useGoogleForEbay).toBe(false);
    });
  });

  describe('saveSettings', () => {
    test('should save settings to AsyncStorage and SecureStore', async () => {
      const settings = {
        openrouterApiKey: 'new-openrouter-key',
        ebayApiKey: 'new-ebay-key',
        googleApiKey: 'new-google-key',
        googleCx: 'new-google-cx',
        serpApiKey: 'new-serp-key',
        ebayEnabled: false,
        kleinanzeigenEnabled: true,
        useGoogleForEbay: true,
        primarySearchEngine: 'google_cse',
      };
      
      AsyncStorage.setItem.mockResolvedValue();
      SecureStore.setItemAsync.mockResolvedValue();
      
      const result = await SettingsService.saveSettings(settings);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_settings',
        JSON.stringify({
          ebayEnabled: false,
          kleinanzeigenEnabled: true,
          useGoogleForEbay: true,
          primarySearchEngine: 'google_cse',
        })
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'secure_openrouter_api_key',
        'new-openrouter-key'
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'secure_ebay_api_key',
        'new-ebay-key'
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'secure_google_api_key',
        'new-google-key'
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'secure_google_cx',
        'new-google-cx'
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'secure_serp_api_key',
        'new-serp-key'
      );
      expect(result).toBe(true);
    });

    test('should delete API keys from SecureStore when empty', async () => {
      const settings = {
        openrouterApiKey: '',
        ebayApiKey: '',
        googleApiKey: '',
        googleCx: '',
        serpApiKey: '',
        ebayEnabled: true,
        kleinanzeigenEnabled: false,
        useGoogleForEbay: false,
        primarySearchEngine: 'ebay_api',
      };
      
      AsyncStorage.setItem.mockResolvedValue();
      SecureStore.deleteItemAsync.mockResolvedValue();
      
      const result = await SettingsService.saveSettings(settings);
      
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('secure_openrouter_api_key');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('secure_ebay_api_key');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('secure_google_api_key');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('secure_google_cx');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('secure_serp_api_key');
      expect(result).toBe(true);
    });

    test('should return false on save error', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      const result = await SettingsService.saveSettings({ 
        openrouterApiKey: 'key',
        ebayApiKey: 'ebay-key',
        googleApiKey: 'google-key',
        googleCx: 'google-cx',
        serpApiKey: '',
      });
      
      expect(result).toBe(false);
    });
  });
});
