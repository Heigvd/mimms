module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['eslint-plugin-import'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
    },
  },
  settings: {
  },
  env: { browser: false, es6: true },
  rules: {
    'no-console': 1,
    'no-alert': 'error',
    'no-var': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-param-reassign': 'error',
    'no-debugger': 'error',
    'prefer-const': 'error',
    // eslint@6.8.0
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    "import/no-unused-modules": [1, {"unusedExports": true}]
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
        },
        warnOnUnsupportedTypeScriptVersion: true,
      },
      rules: {
        'no-undef': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/no-object-literal-type-assertion': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/ban-ts-comment': 'off'
      },
    },
    {
      files: ['*.spec.ts', '*.spec.tsx'],
      env: {
        node: true,
        jest: true,
      },
    },
  ],
};

