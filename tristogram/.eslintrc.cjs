module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unknown-property': ['error', { ignore: ['args', 'geometry', 'material', 'position'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.jsx', '**/test-setup.js'],
      env: {
        'vitest-globals/env': true
      },
      extends: ['plugin:vitest-globals/recommended'],
      globals: {
        vi: 'readonly',
        global: 'readonly',
      }
    }
  ]
};
