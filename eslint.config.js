// eslint.config.js (Flat config for ESLint v9+)

import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactNative from "eslint-plugin-react-native";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["node_modules", "dist", "build"],

    languageOptions: {
      parser: tsParser,

      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
      },
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-native": reactNative,
      import: importPlugin,
    },

    rules: {
      // Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },

    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
        typescript: {},
      },
    },
  },
];
