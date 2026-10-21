import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "vendor/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Noisy in a large admin editor — promoted gradually, not as a hard gate.
      "@next/next/no-img-element": "warn",
      // Storefront rendering intentionally uses safe HTML sanitizers; try/catch
      // and JSX co-location is covered by sanitization, not error boundaries.
      "react-hooks/error-boundaries": "off",
      // Editor state sync effects (preview, media, recovery, inspector) are
      // intentional and reviewed — do not block CI on the generic warning.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
    },
  },
];

export default eslintConfig;
