import React from 'react';
import { render } from '@testing-library/react-native';
import RateLimitIndicator from '../RateLimitIndicator';

describe('RateLimitIndicator Component', () => {
  test('should render with green indicator when usage is below 70%', () => {
    const { getByText } = render(
      <RateLimitIndicator
        apiName="Test API"
        usagePercent={0.5}
        count={250}
        limit={500}
        enabled={true}
      />
    );

    expect(getByText('Test API')).toBeTruthy();
    expect(getByText('250 / 500 calls')).toBeTruthy();
    expect(getByText('(50%)')).toBeTruthy();
    expect(getByText('OK')).toBeTruthy();
  });

  test('should render with yellow indicator when usage is at 70%', () => {
    const { getByText } = render(
      <RateLimitIndicator
        apiName="Test API"
        usagePercent={0.75}
        count={3750}
        limit={5000}
        enabled={true}
      />
    );

    expect(getByText('Test API')).toBeTruthy();
    expect(getByText('3750 / 5000 calls')).toBeTruthy();
    expect(getByText('(75%)')).toBeTruthy();
    expect(getByText('Warning')).toBeTruthy();
  });

  test('should render with yellow indicator when usage is at 98%', () => {
    const { getByText } = render(
      <RateLimitIndicator
        apiName="Test API"
        usagePercent={0.98}
        count={4900}
        limit={5000}
        enabled={true}
      />
    );

    expect(getByText('Test API')).toBeTruthy();
    expect(getByText('4900 / 5000 calls')).toBeTruthy();
    expect(getByText('(98%)')).toBeTruthy();
    expect(getByText('Warning')).toBeTruthy();
  });

  test('should render with red indicator when usage is at 99%', () => {
    const { getByText } = render(
      <RateLimitIndicator
        apiName="Test API"
        usagePercent={0.99}
        count={4950}
        limit={5000}
        enabled={true}
      />
    );

    expect(getByText('Test API')).toBeTruthy();
    expect(getByText('4950 / 5000 calls')).toBeTruthy();
    expect(getByText('(99%)')).toBeTruthy();
    expect(getByText('Critical')).toBeTruthy();
  });

  test('should render disabled state correctly', () => {
    const { getByText } = render(
      <RateLimitIndicator
        apiName="Test API"
        usagePercent={0.5}
        count={250}
        limit={500}
        enabled={false}
      />
    );

    expect(getByText('Test API')).toBeTruthy();
    expect(getByText('Disabled')).toBeTruthy();
  });

  test('should handle N/A limit correctly', () => {
    const { getByText, queryByText } = render(
      <RateLimitIndicator
        apiName="OpenRouter AI"
        usagePercent={0}
        count={50}
        limit="N/A"
        enabled={true}
      />
    );

    expect(getByText('OpenRouter AI')).toBeTruthy();
    expect(getByText('50 / N/A')).toBeTruthy();
    // Should not show percentage when limit is N/A
    expect(queryByText('(0%)')).toBeFalsy();
  });

  test('should handle zero usage correctly', () => {
    const { getByText } = render(
      <RateLimitIndicator
        apiName="Test API"
        usagePercent={0}
        count={0}
        limit={5000}
        enabled={true}
      />
    );

    expect(getByText('Test API')).toBeTruthy();
    expect(getByText('0 / 5000 calls')).toBeTruthy();
    expect(getByText('(0%)')).toBeTruthy();
    expect(getByText('OK')).toBeTruthy();
  });
});
