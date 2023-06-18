module.exports = {
  "plugins": [
    "security"
  ],
  "extends": [
    "airbnb-base",
    "plugin:security/recommended",
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "indent": ["error", 2]
  },
  "env": {
    "mocha": true
  },
  "rules": {
    "quotes": ["error", "single", { "allowTemplateLiterals": true }],
    "no-plusplus": "off",
    "no-restricted-syntax": "off",
    "no-continue": "off",
    "no-throw-literal": "off",
    "consistent-return": "off",
    "no-nested-ternary": "off",
    // Depricated
    "camelcase": "off",
    "security/detect-non-literal-regexp": "off",
    "no-console": "off",
    "no-return-assign": "off",
    "func-names": "off",
    "no-underscore-dangle": "off",
  },
};