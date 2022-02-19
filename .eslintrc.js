module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['preact', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {},
  settings: {
    jest: {
      version: 28,
    },
  },
};
