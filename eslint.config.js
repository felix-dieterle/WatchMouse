import js from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import reactPlugin from 'eslint-plugin-react';
import reactNativePlugin from 'eslint-plugin-react-native';

export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'jest.setup.js',
    ],
  },
  
  // Base configuration
  js.configs.recommended,
  
  // Main configuration
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        requireConfigFile: false,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        it: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-native': reactNativePlugin,
    },
    rules: {
      // React rules
      'react/prop-types': 'off', // We're not using PropTypes
      'react/react-in-jsx-scope': 'off', // Not needed in React Native
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/jsx-uses-vars': 'error', // Prevent false positives for JSX variables
      
      // Code quality
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^React$|^_', // Ignore React and underscore-prefixed vars
      }],
      'no-console': 'off', // We use console.log for debugging
      'no-undef': 'error',
      
      // Best practices
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'warn',
      
      // React Native specific
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'off', // Allow inline styles
      'react-native/no-color-literals': 'off', // Allow color literals
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
