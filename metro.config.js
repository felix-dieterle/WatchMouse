const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure resolver to use react-native and browser fields for package resolution
// This ensures axios uses its browser/react-native compatible version instead of the Node.js version
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];

module.exports = config;
