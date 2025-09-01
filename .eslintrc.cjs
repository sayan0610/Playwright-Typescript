module.exports = {
  root: true,
  env: { es2021: true, node: true, browser: false },
  parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  plugins: ['import'],
  rules: {
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true }
      }
    ]
  },
  ignorePatterns: ['allure-results', 'node_modules', 'playwright-report', 'dist']
};
