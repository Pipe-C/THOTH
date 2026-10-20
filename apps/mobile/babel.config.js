const fs = require('fs');
const path = require('path');

// Cargar .env de apps/mobile para inlining de variables públicas en el bundle
const envVars = {};
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      envVars[key] = val;
    }
  });
}

function inlineEnvPlugin({ types: t }) {
  return {
    visitor: {
      MemberExpression(nodePath) {
        if (
          nodePath.matchesPattern('process.env.FIREBASE_API_KEY') &&
          envVars.FIREBASE_API_KEY
        ) {
          nodePath.replaceWith(t.stringLiteral(envVars.FIREBASE_API_KEY));
        } else if (
          nodePath.matchesPattern('process.env.FIREBASE_PROJECT_ID') &&
          envVars.FIREBASE_PROJECT_ID
        ) {
          nodePath.replaceWith(t.stringLiteral(envVars.FIREBASE_PROJECT_ID));
        }
      },
    },
  };
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['nativewind/babel', inlineEnvPlugin],
};