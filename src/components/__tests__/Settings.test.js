import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Settings from '../Settings';
import { SettingsService } from '../../services/SettingsService';

// Mock SettingsService
jest.mock('../../services/SettingsService');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('Settings Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSettingsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    SettingsService.loadSettings.mockResolvedValue({
      openrouterApiKey: 'test-key',
      ebayEnabled: true,
      kleinanzeigenEnabled: true,
    });
  });

  test('should render settings screen', async () => {
    const { getByText } = render(
      <Settings onClose={mockOnClose} onSettingsChange={mockOnSettingsChange} />
    );

    await waitFor(() => {
      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('AI Configuration')).toBeTruthy();
      expect(getByText('Platform Modules')).toBeTruthy();
    });
  });

  test('should load settings on mount', async () => {
    render(<Settings onClose={mockOnClose} onSettingsChange={mockOnSettingsChange} />);

    await waitFor(() => {
      expect(SettingsService.loadSettings).toHaveBeenCalled();
    });
  });

  test('should display loading state initially', () => {
    const { getByText } = render(
      <Settings onClose={mockOnClose} onSettingsChange={mockOnSettingsChange} />
    );

    expect(getByText('Loading settings...')).toBeTruthy();
  });

  test('should call onClose when close button is pressed', async () => {
    const { getByLabelText } = render(
      <Settings onClose={mockOnClose} onSettingsChange={mockOnSettingsChange} />
    );

    await waitFor(() => {
      expect(SettingsService.loadSettings).toHaveBeenCalled();
    });

    const closeButton = getByLabelText('Close settings');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should save settings and show success alert', async () => {
    SettingsService.saveSettings.mockResolvedValue(true);

    const { getByText } = render(
      <Settings onClose={mockOnClose} onSettingsChange={mockOnSettingsChange} />
    );

    await waitFor(() => {
      expect(SettingsService.loadSettings).toHaveBeenCalled();
    });

    const saveButton = getByText('Save Settings');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(SettingsService.saveSettings).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Settings saved successfully!');
      expect(mockOnSettingsChange).toHaveBeenCalled();
    });
  });

  test('should show error alert when saving fails', async () => {
    SettingsService.saveSettings.mockResolvedValue(false);

    const { getByText } = render(
      <Settings onClose={mockOnClose} onSettingsChange={mockOnSettingsChange} />
    );

    await waitFor(() => {
      expect(SettingsService.loadSettings).toHaveBeenCalled();
    });

    const saveButton = getByText('Save Settings');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save settings');
    });
  });

  test('should update API key input', async () => {
    const { getByPlaceholderText } = render(
      <Settings onClose={mockOnClose} onSettingsChange={mockOnSettingsChange} />
    );

    await waitFor(() => {
      expect(SettingsService.loadSettings).toHaveBeenCalled();
    });

    const apiKeyInput = getByPlaceholderText('Enter your OpenRouter API key');
    fireEvent.changeText(apiKeyInput, 'new-api-key');

    expect(apiKeyInput.props.value).toBe('new-api-key');
  });

  test('should toggle eBay switch', async () => {
    const { getByLabelText } = render(
      <Settings onClose={mockOnClose} onSettingsChange={mockOnSettingsChange} />
    );

    await waitFor(() => {
      expect(SettingsService.loadSettings).toHaveBeenCalled();
    });

    const ebaySwitch = getByLabelText('Toggle eBay');
    expect(ebaySwitch.props.value).toBe(true);

    fireEvent(ebaySwitch, 'valueChange', false);
    expect(ebaySwitch.props.value).toBe(false);
  });

  test('should toggle Kleinanzeigen switch', async () => {
    const { getByLabelText } = render(
      <Settings onClose={mockOnClose} onSettingsChange={mockOnSettingsChange} />
    );

    await waitFor(() => {
      expect(SettingsService.loadSettings).toHaveBeenCalled();
    });

    const kleinanzeigenSwitch = getByLabelText('Toggle Kleinanzeigen');
    expect(kleinanzeigenSwitch.props.value).toBe(true);

    fireEvent(kleinanzeigenSwitch, 'valueChange', false);
    expect(kleinanzeigenSwitch.props.value).toBe(false);
  });

  test('should prevent both platforms from being disabled', async () => {
    SettingsService.loadSettings.mockResolvedValue({
      openrouterApiKey: '',
      ebayEnabled: true,
      kleinanzeigenEnabled: false,
    });

    const { getByLabelText } = render(
      <Settings onClose={mockOnClose} onSettingsChange={mockOnSettingsChange} />
    );

    await waitFor(() => {
      expect(SettingsService.loadSettings).toHaveBeenCalled();
    });

    const ebaySwitch = getByLabelText('Toggle eBay');
    fireEvent(ebaySwitch, 'valueChange', false);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'At least one platform must be enabled'
      );
    });
  });
});
