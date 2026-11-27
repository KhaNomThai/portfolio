import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
    },
    rules: {
      // line() ใน icons.tsx คืน component: บอก rule ว่าเป็น HOC ไม่อย่างนั้นนับไอคอนเป็นค่าคงที่
      'react-refresh/only-export-components': ['error', { allowConstantExport: true, allowCompoundComponents: true, extraHOCs: ['line'] }],
    },
  },
  {
    // สคริปต์ใน scripts/ (cv, og, photos, shots, check:tokens, check:data) และ vite.config รันด้วย Node ไม่ใช่ในเบราว์เซอร์
    files: ['scripts/**/*.ts', 'vite.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
