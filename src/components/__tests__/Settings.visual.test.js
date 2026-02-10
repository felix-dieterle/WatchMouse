/**
 * Visual tests for Settings component
 * These tests verify the rendering of UI elements, especially the new
 * OpenRouter model selection help information box.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Settings from '../Settings';

// Mock the services
jest.mock('../../services/SettingsService', () => ({
  SettingsService: {
    loadSettings: jest.fn(() => Promise.resolve({
      openrouterApiKey: '',
      ebayApiKey: '',
      googleApiKey: '',
      googleCx: '',
      ebayEnabled: true,
      kleinanzeigenEnabled: true,
      useGoogleForEbay: false,
      usedCarsEnabled: false,
    })),
    saveSettings: jest.fn(() => Promise.resolve(true)),
  },
}));

jest.mock('../../services/SearchService', () => ({
  SearchService: jest.fn().mockImplementation(() => ({
    getEbayRateLimitStats: jest.fn(() => Promise.resolve({
      count: 0,
      limit: 5000,
      usagePercent: 0,
    })),
    getGoogleRateLimitStats: jest.fn(() => Promise.resolve({
      count: 0,
      limit: 100,
      usagePercent: 0,
    })),
  })),
}));

jest.mock('../../services/AIService', () => ({
  AIService: {
    getOpenRouterRateLimitStats: jest.fn(() => Promise.resolve({
      count: 0,
      limit: null,
      usagePercent: 0,
    })),
  },
}));

describe('Settings Visual Tests', () => {
  const defaultProps = {
    onClose: jest.fn(),
    onSettingsChange: jest.fn(),
  };

  it('should render OpenRouter model selection info box', async () => {
    const { getByText, findByText } = render(<Settings {...defaultProps} />);

    // Wait for settings to load
    await findByText('OpenRouter API Key');

    // Check that the info box title is rendered
    expect(getByText('💡 Choosing a Model')).toBeTruthy();

    // Check that key help text is present
    expect(getByText(/WatchMouse uses simple AI to match search results/)).toBeTruthy();
    expect(getByText(/Free models work great!/)).toBeTruthy();
  });

  it('should display recommended free models', async () => {
    const { getByText, findByText } = render(<Settings {...defaultProps} />);

    // Wait for settings to load
    await findByText('OpenRouter API Key');

    // Check for recommended free models
    expect(getByText(/meta-llama\/llama-3.2-3b-instruct:free/)).toBeTruthy();
    expect(getByText(/google\/gemini-flash-1.5:free/)).toBeTruthy();
  });

  it('should display current default model information', async () => {
    const { getByText, findByText } = render(<Settings {...defaultProps} />);

    // Wait for settings to load
    await findByText('OpenRouter API Key');

    // Check for current default model (now free!)
    expect(getByText(/meta-llama\/llama-3.2-3b-instruct:free/)).toBeTruthy();
    expect(getByText(/Current default - FREE!/)).toBeTruthy();
  });

  it('should display link to model guide documentation', async () => {
    const { getByText, findByText } = render(<Settings {...defaultProps} />);

    // Wait for settings to load
    await findByText('OpenRouter API Key');

    // Check for documentation reference
    expect(getByText(/docs\/OPENROUTER_MODEL_GUIDE.md/)).toBeTruthy();
  });

  it('should display link to browse models', async () => {
    const { getByText, findByText } = render(<Settings {...defaultProps} />);

    // Wait for settings to load
    await findByText('OpenRouter API Key');

    // Check for link to OpenRouter free models
    expect(getByText(/https:\/\/openrouter.ai\/collections\/free-models/)).toBeTruthy();
  });

  it('should render info box with proper styling', async () => {
    const { findByText } = render(<Settings {...defaultProps} />);

    // Wait for settings to load
    await findByText('OpenRouter API Key');

    // Check that the info box and its components are rendered
    const infoTitle = await findByText('💡 Choosing a Model');
    expect(infoTitle).toBeTruthy();

    // The info box should contain multiple text elements
    const recommendedText = await findByText(/Recommended free models:/);
    expect(recommendedText).toBeTruthy();

    const paidAlternativeText = await findByText(/Paid alternative:/);
    expect(paidAlternativeText).toBeTruthy();

    const browseText = await findByText(/Browse models:/);
    expect(browseText).toBeTruthy();
  });
});
