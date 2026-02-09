# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Zotero Nexus is a Zotero 7 add-on that enables automatic PDF downloads for items with a DOI. It hooks into Zotero's built-in PDF resolver chain (`Zotero.Attachments.getPDFResolvers()`) and injects a [Nexus](https://hub.libstc.cc) resolver as a fallback source. Inspired by [Zotero Scihub](https://github.com/ethanwillis/zotero-scihub).

## Build & Development Commands

```bash
npm install              # Install dependencies
npm run build            # Production build: tsc --noEmit + esbuild + .xpi packaging
npm start                # Dev server: builds, launches Zotero, watches src/ and addon/ for changes
npm run stop             # Stop dev server
npm run lint             # Prettier + ESLint with auto-fix
```

No test framework is configured (`npm test` exits with error).

## Build Process

The build (`scripts/build.mjs`) does:

1. TypeScript type-checking (`tsc --noEmit`)
2. Copies `addon/` templates to `build/addon/`, replacing `__variables__` from `package.json` config
3. Processes locale FTL files (adds addon-specific prefixes)
4. Bundles `src/index.ts` via esbuild (target: Firefox 102) → `build/addon/chrome/content/scripts/zoteronexus.js`
5. Zips into `build/zotero-nexus.xpi`
6. Generates update manifest (`update.json` or `update-beta.json` based on version string containing `-`)

The dev server (`npm start`) watches for changes and auto-reloads the extension in Zotero via `zotero://ztoolkit-debug/`.

## Architecture

### Addon Lifecycle

`addon/bootstrap.js` → `src/index.ts` → `src/addon.ts` → `src/hooks.ts`

- **bootstrap.js**: Zotero 7 entry point. Registers chrome manifest, loads bundled script into sandbox, dispatches lifecycle events.
- **Addon class** (`src/addon.ts`): Singleton stored at `Zotero.ZoteroNexus`. Holds shared state (ztoolkit instance, locale, prefs window ref).
- **Hooks** (`src/hooks.ts`): `onStartup` initializes prefs and registers the Nexus PDF resolver. `onMainWindowLoad/Unload` manage per-window ZToolkit instances.

### Core Logic

**`src/modules/nexus.ts`** — Overrides `Zotero.Attachments.getPDFResolvers()` to return a resolver chain:

1. **DOI resolver**: Direct `https://doi.org/{doi}` URL
2. **URL resolver**: Item's URL field
3. **OA resolver**: Zotero's open-access API (`getOpenAccessPDFURLs`)
4. **Custom resolvers**: Reads JSON config from `Zotero.Prefs.get("findPDFs.resolvers")`, supports HTML (CSS selector), JSON (JSONPath via jspath), and PDF (direct) modes. The Nexus resolver (`https://hub.libstc.cc/{doi}.pdf`) is injected here.

The `automatic` preference controls whether all resolvers run or only those marked `automatic: true`.

### Preferences

Single toggle: "Automatic PDF Download" (`extensions.zotero.zoteronexus.automatic-pdf-download`, default: `true`). UI in `addon/chrome/content/preferences.xhtml`, logic in `src/modules/preferences.ts`.

### Utilities (`src/utils/`)

- **ztoolkit.ts**: ZToolkit initialization (logging, plugin ID, icons)
- **prefs.ts**: Namespaced wrappers around `Zotero.Prefs` get/set/clear
- **locale.ts**: Fluent-based i18n with `getString(key, options?)`
- **wait.ts**: Polling utilities (`waitUntil`, `waitUtilAsync`)

## Key Config

- **package.json `config`**: Addon metadata (ID: `zotero-nexus@aokellermann.dev`, ref: `zoteronexus`) used by build template substitution
- **tsconfig.json**: `strict: true`, target ES2016, CommonJS modules
- **ESLint**: `@typescript-eslint/recommended` + prettier; `no-explicit-any` and `no-unused-vars` disabled
- **Prettier**: 80 char width, 2-space tabs, LF endings
- **Zotero compatibility**: 6.999–7.0.\* (manifest.json)
