module.exports = {
  "plugins": [
    "security"
  ],
  "extends": [
    "airbnb-base",
    "plugin:security/recommended",
  ],
  "env": {
    "mocha": true
  },
  "rules": {
    "no-plusplus": "off",
    "no-restricted-syntax": "off",
    "no-continue": "off",
    "no-throw-literal": "off",
    "consistent-return": "off",
    "no-nested-ternary": "off",
    "camelcase": "off",
    "security/detect-non-literal-regexp": "off",
    "no-console": "off",
  },
};