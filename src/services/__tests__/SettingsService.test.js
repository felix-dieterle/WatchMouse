import { SettingsService } from '../SettingsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadSettings', () => {
    test('should load saved settings from AsyncStorage', async () => {
      const mockSettings = {
        openrouterApiKey: 'test-api-key',
        ebayEnabled: true,
        kleinanzeigenEnabled: false,
      };
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockSettings));
      
      const settings = await SettingsService.loadSettings();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('app_settings');
      expect(settings).toEqual(mockSettings);
    });

    test('should return default settings when no saved settings exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      
      const settings = await SettingsService.loadSettings();
      
      expect(settings).toEqual({
        openrouterApiKey: '',
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
      });
    });

    test('should return default settings on error', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      
      const settings = await SettingsService.loadSettings();
      
      expect(settings).toEqual({
        openrouterApiKey: '',
        ebayEnabled: true,
        kleinanzeigenEnabled: true,
      });
    });
  });

  describe('saveSettings', () => {
    test('should save settings to AsyncStorage', async () => {
      const settings = {
        openrouterApiKey: 'new-api-key',
        ebayEnabled: false,
        kleinanzeigenEnabled: true,
      };
      
      AsyncStorage.setItem.mockResolvedValue();
      
      const result = await SettingsService.saveSettings(settings);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'app_settings',
        JSON.stringify(settings)
      );
      expect(result).toBe(true);
    });

    test('should return false on save error', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
      
      const result = await SettingsService.saveSettings({ openrouterApiKey: 'key' });
      
      expect(result).toBe(false);
    });
  });
});
