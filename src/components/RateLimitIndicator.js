import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Small colored indicator showing API rate limit status
 * 
 * Colors:
 * - Green: 0-69% usage (safe)
 * - Yellow: 70-89% usage (warning)
 * - Red: 90%+ usage (critical)
 * 
 * @param {Object} props
 * @param {string} props.apiName - Name of the API (e.g., "eBay", "OpenRouter")
 * @param {number} props.usagePercent - Usage percentage (0-1)
 * @param {number} props.count - Number of API calls made
 * @param {number|string} props.limit - Daily limit (or "N/A" for unlimited)
 * @param {boolean} props.enabled - Whether the API is enabled
 */
export default function RateLimitIndicator({ 
  apiName, 
  usagePercent = 0, 
  count = 0, 
  limit = 'N/A',
  enabled = true,
}) {
  // Determine indicator color based on usage percentage
  const getIndicatorColor = () => {
    if (!enabled) {
      return '#ccc'; // Gray for disabled
    }
    
    if (usagePercent >= 0.9) {
      return '#f44336'; // Red for 90%+
    }
    
    if (usagePercent >= 0.7) {
      return '#ff9800'; // Yellow/Orange for 70%+
    }
    
    return '#4caf50'; // Green for < 70%
  };

  // Determine status text
  const getStatusText = () => {
    if (!enabled) {
      return 'Disabled';
    }
    
    if (usagePercent >= 0.9) {
      return 'Critical';
    }
    
    if (usagePercent >= 0.7) {
      return 'Warning';
    }
    
    return 'OK';
  };

  const indicatorColor = getIndicatorColor();
  const statusText = getStatusText();
  const usagePercentDisplay = Math.round(usagePercent * 100);

  return (
    <View style={styles.container}>
      <View style={styles.apiInfo}>
        <Text style={styles.apiName}>{apiName}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {count} / {limit === 'N/A' ? limit : `${limit} calls`}
          </Text>
          {limit !== 'N/A' && (
            <Text style={styles.percentText}>({usagePercentDisplay}%)</Text>
          )}
        </View>
      </View>
      <View style={styles.indicatorContainer}>
        <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
        <Text style={[styles.statusText, { color: indicatorColor }]}>
          {statusText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  apiInfo: {
    flex: 1,
  },
  apiName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  percentText: {
    fontSize: 12,
    color: '#999',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
  },
});
