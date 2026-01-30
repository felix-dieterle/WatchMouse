import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';
import { SettingsService } from '../src/services/SettingsService';

// Services are mocked in jest.setup.js
jest.mock('../src/services/SettingsService');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    SettingsService.loadSettings.mockResolvedValue({
      openrouterApiKey: 'test-key',
      ebayEnabled: true,
      kleinanzeigenEnabled: true,
    });
    
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'searches') {
        return Promise.resolve(JSON.stringify([
          { id: '1', query: 'iPhone', maxPrice: 500, createdAt: new Date().toISOString() }
        ]));
      }
      if (key === 'matches') {
        return Promise.resolve(JSON.stringify([
          { 
            id: 'match-1', 
            title: 'iPhone 12', 
            price: 450, 
            platform: 'eBay',
            isRead: false,
            timestamp: new Date().toISOString()
          }
        ]));
      }
      return Promise.resolve(null);
    });
    
    AsyncStorage.setItem.mockResolvedValue();
  });

  test('should render app title', async () => {
    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText('4You WatchMouse')).toBeTruthy();
      expect(getByText('Shopping Deal Monitor')).toBeTruthy();
    });
  });

  test('should load settings on mount', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(SettingsService.loadSettings).toHaveBeenCalled();
    });
  });

  test('should load saved searches on mount', async () => {
    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('searches');
      expect(getByText('iPhone')).toBeTruthy();
    });
  });

  test('should load saved matches on mount', async () => {
    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('matches');
      expect(getByText('iPhone 12')).toBeTruthy();
    });
  });

  test('should show warning banner when no API key configured', async () => {
    SettingsService.loadSettings.mockResolvedValue({
      openrouterApiKey: '',
      ebayEnabled: true,
      kleinanzeigenEnabled: true,
    });

    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText(/No API key/)).toBeTruthy();
    });
  });

  test('should open settings modal', async () => {
    const { getByLabelText, getByText } = render(<App />);
    
    await waitFor(() => {
      expect(SettingsService.loadSettings).toHaveBeenCalled();
    });

    const settingsButton = getByLabelText('Settings');
    fireEvent.press(settingsButton);

    await waitFor(() => {
      expect(getByText('AI Configuration')).toBeTruthy();
    });
  });

  test('should filter searches by query', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'searches') {
        return Promise.resolve(JSON.stringify([
          { id: '1', query: 'iPhone', maxPrice: 500, createdAt: new Date().toISOString() },
          { id: '2', query: 'iPad', maxPrice: 800, createdAt: new Date().toISOString() }
        ]));
      }
      return Promise.resolve(null);
    });

    const { getByPlaceholderText, getByText, queryByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText('iPhone')).toBeTruthy();
      expect(getByText('iPad')).toBeTruthy();
    });

    const filterInput = getByPlaceholderText('Filter searches...');
    fireEvent.changeText(filterInput, 'iPhone');

    await waitFor(() => {
      expect(getByText('iPhone')).toBeTruthy();
      expect(queryByText('iPad')).toBeNull();
    });
  });

  test('should handle AsyncStorage errors gracefully', async () => {
    AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText('4You WatchMouse')).toBeTruthy();
    });
    
    // App should still render even with storage errors
    expect(AsyncStorage.getItem).toHaveBeenCalled();
  });

  test('should handle empty searches list', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText('4You WatchMouse')).toBeTruthy();
    });
    
    // App should render even with no saved searches
    expect(AsyncStorage.getItem).toHaveBeenCalled();
  });

  test('should open link when "Open Link" button is pressed', async () => {
    const { Linking } = require('react-native');
    
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'matches') {
        return Promise.resolve(JSON.stringify([
          { 
            id: 'match-1', 
            title: 'iPhone 12', 
            price: 450, 
            platform: 'eBay',
            url: 'https://www.ebay.de/itm/12345',
            isRead: false,
            foundAt: new Date().toISOString()
          }
        ]));
      }
      return Promise.resolve(null);
    });

    const { getByText } = render(<App />);
    
    await waitFor(() => {
      expect(getByText('iPhone 12')).toBeTruthy();
    });

    const openLinkButton = getByText('🔗 Open Link');
    fireEvent.press(openLinkButton);

    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalledWith('https://www.ebay.de/itm/12345');
      expect(Linking.openURL).toHaveBeenCalledWith('https://www.ebay.de/itm/12345');
    });
  });
});
