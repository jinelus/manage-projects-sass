/** @type { import('eslint').Linter.Config } */
module.exports = {
  extends: ['next/core-web-vitals', '@rocketseat/eslint-config/next'],
  plugins: ['simple-import-sort'],
  rules: {
    'simple-import-sort/imports': 'error',
    'react/jsx-filename-extension': 'off',
    'import/prefer-default-export': 'off',
  },
  ignorePatterns: ['package.json'],
}
