// Flat ESLint configuration for customer-app to match monorepo style.

// Attempt to load TypeScript parser if installed locally; fall back to JS-only linting.
const _tryRequire = (name) => {
  try {
    return require(name)
  } catch (e) {
    return undefined
  }
}

const _tsParser = _tryRequire('@typescript-eslint/parser')
const _tsPlugin = _tryRequire('@typescript-eslint/eslint-plugin')
const _hasTsParser = !!_tsParser
const _hasTsPlugin = !!_tsPlugin

module.exports = [
  // Ignore common directories
  { ignores: ['node_modules/**', 'dist/**', 'build/**'] },

  // Basic JS/TS ruleset with JSX support. Keep rules minimal to avoid requiring
  // many plugins; this stabilizes lint runs in the monorepo.
  {
    files: _hasTsParser ? ['**/*.{js,jsx,ts,tsx}'] : ['**/*.{js,jsx}'],
    languageOptions: _hasTsParser
      ? {
          parser: _tsParser,
          parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            ecmaFeatures: { jsx: true },
          },
        }
      : {
          parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            ecmaFeatures: { jsx: true },
          },
        },
    // Keep only plugin-free rules for now to avoid plugin resolution errors.
    rules: {
      'no-undef': 'off',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
    },
  },
]
