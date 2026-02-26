import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { logger, LOG_LEVELS } from '../utils/logger';

/**
 * LogView Component
 *
 * Modal that displays in-app log entries captured by the logger utility.
 * Helps users diagnose why zero results were found and understand app behaviour.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Called when the modal is closed
 */
function LogView({ visible, onClose }) {
  const [entries, setEntries] = useState(() => logger.getEntries());

  // Subscribe to logger updates while the modal is mounted
  useEffect(() => {
    const unsubscribe = logger.subscribe(setEntries);
    return unsubscribe;
  }, []);

  // Refresh entries when modal opens so the list is up-to-date
  useEffect(() => {
    if (visible) {
      setEntries(logger.getEntries());
    }
  }, [visible]);

  const handleClear = useCallback(() => {
    logger.clear();
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📋 App Logs</Text>
          <Text style={styles.entryCount}>{entries.length} entries</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              accessibilityLabel="Clear logs"
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close log view"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Log entries */}
        <ScrollView
          style={styles.logList}
          contentContainerStyle={styles.logListContent}
        >
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No log entries yet. Run a search to see activity.</Text>
          ) : (
            entries.map(entry => (
              <View
                key={entry.id}
                style={[styles.entry, ENTRY_STYLES[entry.level]]}
              >
                <View style={styles.entryMeta}>
                  <Text style={[styles.entryLevel, LEVEL_TEXT_STYLES[entry.level]]}>
                    {LEVEL_LABELS[entry.level]}
                  </Text>
                  <Text style={styles.entryTime}>
                    {formatTime(entry.timestamp)}
                  </Text>
                </View>
                <Text style={styles.entryMessage}>{entry.message}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_LABELS = {
  [LOG_LEVELS.INFO]: 'INFO',
  [LOG_LEVELS.WARN]: 'WARN',
  [LOG_LEVELS.ERROR]: 'ERR ',
};

function formatTime(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  headerTitle: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  entryCount: {
    color: '#888',
    fontSize: 13,
    marginRight: 12,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  clearButton: {
    backgroundColor: '#c0392b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  closeButton: {
    backgroundColor: '#555',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logList: {
    flex: 1,
  },
  logListContent: {
    padding: 8,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
    fontSize: 14,
  },
  entry: {
    borderRadius: 4,
    padding: 8,
    marginBottom: 4,
    backgroundColor: '#0f3460',
  },
  entryWarn: {
    backgroundColor: '#2d1b00',
  },
  entryError: {
    backgroundColor: '#2d0000',
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  entryLevel: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginRight: 8,
    color: '#4fc3f7',
  },
  levelWarn: {
    color: '#ffb74d',
  },
  levelError: {
    color: '#ef9a9a',
  },
  entryTime: {
    fontSize: 11,
    color: '#777',
    fontFamily: 'monospace',
  },
  entryMessage: {
    fontSize: 12,
    color: '#ccc',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});

// Style lookup maps (must be after StyleSheet.create)
const ENTRY_STYLES = {
  [LOG_LEVELS.INFO]: null,
  [LOG_LEVELS.WARN]: styles.entryWarn,
  [LOG_LEVELS.ERROR]: styles.entryError,
};

const LEVEL_TEXT_STYLES = {
  [LOG_LEVELS.INFO]: null,
  [LOG_LEVELS.WARN]: styles.levelWarn,
  [LOG_LEVELS.ERROR]: styles.levelError,
};

export default LogView;
