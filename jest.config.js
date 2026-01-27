module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|react-navigation|@react-navigation|@react-native-async-storage)/)',
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
