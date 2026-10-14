import tseslint from "typescript-eslint";
export default tseslint.config(
  { ignores: [".next/**", "archive/**", "research/**", "node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
