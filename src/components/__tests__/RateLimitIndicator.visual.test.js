/**
 * Visual test for RateLimitIndicator component
 * This file demonstrates all states of the rate limit indicators
 * Run with: npm test -- VisualTest
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import RateLimitIndicator from '../RateLimitIndicator';

describe('RateLimitIndicator - Visual States', () => {
  test('render all visual states for documentation', () => {
    const TestContainer = () => (
      <View style={styles.container}>
        <Text style={styles.title}>Rate Limit Indicator States</Text>
        
        <Text style={styles.sectionTitle}>Green - Safe (0-69%)</Text>
        <RateLimitIndicator
          apiName="eBay API"
          usagePercent={0.02}
          count={100}
          limit={5000}
          enabled={true}
        />
        
        <Text style={styles.sectionTitle}>Yellow - Warning (70-89%)</Text>
        <RateLimitIndicator
          apiName="eBay API"
          usagePercent={0.75}
          count={3750}
          limit={5000}
          enabled={true}
        />
        
        <Text style={styles.sectionTitle}>Red - Critical (90%+)</Text>
        <RateLimitIndicator
          apiName="eBay API"
          usagePercent={0.95}
          count={4750}
          limit={5000}
          enabled={true}
        />
        
        <Text style={styles.sectionTitle}>OpenRouter - No Hard Limit</Text>
        <RateLimitIndicator
          apiName="OpenRouter AI"
          usagePercent={0}
          count={50}
          limit="N/A"
          enabled={true}
        />
        
        <Text style={styles.sectionTitle}>Disabled State</Text>
        <RateLimitIndicator
          apiName="eBay API"
          usagePercent={0}
          count={0}
          limit={5000}
          enabled={false}
        />
      </View>
    );

    const { toJSON } = render(<TestContainer />);
    
    // Verify render
    expect(toJSON()).toBeTruthy();
    
    // Log component tree for visual inspection
    console.log('\n=== Rate Limit Indicator Visual States ===');
    console.log('1. Green (Safe): 2% usage');
    console.log('2. Yellow (Warning): 75% usage');
    console.log('3. Red (Critical): 95% usage');
    console.log('4. OpenRouter: No hard limit');
    console.log('5. Disabled: API not enabled');
    console.log('==========================================\n');
  });
});

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#666',
  },
});
