declare const process: {
  env: Record<string, string | undefined>;
};

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY ?? '';
const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ?? 'toth-app-ceaf6';

export const FIREBASE_CONFIG = {
  apiKey: FIREBASE_API_KEY,
  projectId: FIREBASE_PROJECT_ID,
  isConfigured: FIREBASE_API_KEY.length > 0,
} as const;

export const FIREBASE_CONFIG_ERROR =
  'Firebase no está configurado en esta compilación. Copia apps/mobile/.env.example a .env, completa FIREBASE_API_KEY y vuelve a compilar (npm run android).';
