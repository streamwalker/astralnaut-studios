import { defineConfig, loadEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

/**
 * Owned build configuration for Astralnaut Studios.
 *
 * Replaces @lovable.dev/vite-tanstack-config. Plugin order below is load-bearing
 * and mirrors the production path of the package it replaced:
 *   tailwindcss -> tsConfigPaths -> tanstackStart -> nitro (build only) -> react
 *
 * Dropped from the old wrapper (all dev/sandbox-only, `apply: "serve"`):
 *   @tanstack/devtools-vite, dev-server-fn-error-logger, dev-ssr-error-logger,
 *   lovable build diagnostics, HMR gate, dev-server bridge, assets proxy.
 *
 * Output: .output/ (nitro cloudflare-module preset) with a generated
 * .output/server/wrangler.json — deploy with `wrangler deploy` from .output/server.
 */
export default defineConfig(({ command, mode }) => {
  // Inline VITE_* env vars the same way the old wrapper did, so client code
  // reading import.meta.env.VITE_* keeps working in the SSR/worker bundle.
  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), "VITE_"))) {
    define[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  const plugins: PluginOption[] = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Route the SSR entry through src/server.ts (branded error pages + h3 500 normalisation).
      server: { entry: "server" },
      // Fail the build if client code pulls in a server-only module.
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
  ];

  // Nitro owns the deployable output; it is a build-time concern only.
  if (command === "build") {
    plugins.push(nitro({ defaultPreset: "cloudflare-module" }));
  }

  plugins.push(react());

  return {
    plugins,
    define,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      // Multiple copies of these break hooks and query context across the
      // client/SSR boundary.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    server: {
      host: "::",
      port: 8080,
    },
  };
});
