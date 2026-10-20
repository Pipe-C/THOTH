// -----------------------------------------------------------------
// src/config/firebase.ts — Firebase credentials & configuration
// -----------------------------------------------------------------
// Values are resolved from `.env` via Babel inlining at build time,
// keeping sensitive API keys out of git-tracked files.
// -----------------------------------------------------------------

declare const process: {
  env?: Record<string, string | undefined>;
};

export const FIREBASE_CONFIG = {
  apiKey: process.env?.FIREBASE_API_KEY || 'REPLACE_WITH_FIREBASE_WEB_API_KEY',
  projectId: process.env?.FIREBASE_PROJECT_ID || 'toth-app-ceaf6',
};
