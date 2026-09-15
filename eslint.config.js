import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // `android/` is Capacitor's generated native project — it mirrors the
  // built web assets (including the minified service worker) into
  // android/app/src/main/assets/public on every `cap sync`, which isn't
  // source and shouldn't be linted.
  { ignores: ['dist', 'android'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Mark identifiers used only inside JSX (e.g. `motion`, components) as used,
      // so no-unused-vars stops reporting false positives.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Everything now goes through src/utils/logger.js — see that file's
      // header comment — so a stray console.* fails lint instead of quietly
      // shipping an untracked, unstructured log line.
      'no-console': 'error',
    },
  },
  {
    // The one file actually allowed to talk to the real console — it's what
    // every other module's console.* call was replaced with.
    files: ['src/utils/logger.js'],
    rules: { 'no-console': 'off' },
  },
  {
    // Build-tool config files run under Node, not the browser — they need
    // `process`/`import.meta` Node globals instead of `globals.browser`.
    files: ['vite.config.js', 'postcss.config.js', 'tailwind.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]
