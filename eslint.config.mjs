import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['coverage/**'] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node } },
  { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
  {
    rules: {
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
    },
  },
];
