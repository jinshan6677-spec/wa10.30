module.exports = {
  ...require('./.eslintrc.js'),
  rules: {
    ...require('./.eslintrc.js').rules,
    'class-methods-use-this': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    'no-nested-ternary': 'warn',
    'consistent-return': 'warn',
    '@typescript-eslint/no-use-before-define': 'warn',
    'react/display-name': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/interactive-supports-focus': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    'no-plusplus': 'warn',
    'no-await-in-loop': 'warn',
  },
};
