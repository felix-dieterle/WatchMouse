module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-secure-store|expo-status-bar|react-navigation|@react-navigation|@react-native-async-storage|react-error-boundary)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    'App.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
