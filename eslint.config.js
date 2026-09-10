import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'build/**',
      '.react-router/**',
      '.wrangler/**',
      'dist/**',
      'node_modules/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // app/routes/home.tsx intentionally seeds state from localStorage on mount
      // (a lazy initialiser would hydrate differently from the server) and closes
      // menus when the hero slide changes. Both would need a store / derived-state
      // refactor, so keep them visible as warnings instead of blocking the build.
      'react-hooks/set-state-in-effect': 'warn',
    },
  }
)
