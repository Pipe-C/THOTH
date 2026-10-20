// -----------------------------------------------------------------
// src/config/firebase.ts — Firebase credentials & configuration
// -----------------------------------------------------------------
// Resolves credentials dynamically:
// 1. Local untracked credentials from `firebase.local.ts` (ignored by git).
// 2. Environment variables from process.env (CI / production bundles).
// 3. Fallback placeholder values (prevents build breakages on fresh clones).
// -----------------------------------------------------------------

interface FirebaseConfig {
  apiKey: string;
  projectId: string;
}

let localConfig: Partial<FirebaseConfig> = {};

try {
  // @ts-ignore: firebase.local is untracked and created on-demand
  localConfig = require('./firebase.local');
} catch {
  // Ignored: running in CI or fresh clone without firebase.local.ts
}

declare const process: {
  env?: Record<string, string | undefined>;
};

const envApiKey = typeof process !== 'undefined' ? process.env?.FIREBASE_API_KEY : undefined;
const envProjectId = typeof process !== 'undefined' ? process.env?.FIREBASE_PROJECT_ID : undefined;

export const FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: envApiKey || localConfig.apiKey || 'REPLACE_WITH_FIREBASE_WEB_API_KEY',
  projectId: envProjectId || localConfig.projectId || 'REPLACE_WITH_FIREBASE_PROJECT_ID',
};
