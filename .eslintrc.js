module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:cypress/recommended',
  ],
  plugins: [
    'cypress',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'linebreak-style': 0,
    'no-param-reassign': 0,
    'no-loop-func': 0,
    'cypress/no-unnecessary-waiting': 0,
  },
};
