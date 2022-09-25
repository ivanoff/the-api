module.exports = {
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "security",
    "@typescript-eslint"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
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
    "camelcase": "off",
    "security/detect-non-literal-regexp": "off",
    "no-console": "off",
    "no-return-assign": "off",
    "func-names": "off",
    "no-underscore-dangle": "off",
    "@typescript-eslint/no-explicit-any": "off"
  },
};