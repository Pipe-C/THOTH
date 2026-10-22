const fs = require('fs');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '.env');
const APP_ENV_KEYS = [
  'FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID',
  'API_BASE_URL',
];

function loadEnv(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) return values;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');

    if (key) values[key] = value;
  }
  return values;
}

const envVars = loadEnv(ENV_PATH);

function isMemberAccess(node) {
  return (
    node &&
    (node.type === 'MemberExpression' ||
      node.type === 'OptionalMemberExpression')
  );
}

function isProcessEnv(node) {
  if (!isMemberAccess(node)) return false;

  const key = staticKey(node);
  if (key !== 'env') return false;

  const object = node.object;
  if (isMemberAccess(object)) return staticKey(object) === 'process';
  return object && object.type === 'Identifier' && object.name === 'process';
}

function staticKey(node) {
  if (!isMemberAccess(node)) return null;
  if (!node.computed && node.property.type === 'Identifier') {
    return node.property.name;
  }
  if (node.computed && node.property.type === 'StringLiteral') {
    return node.property.value;
  }
  return null;
}

function inlineEnvPlugin(api) {
  const { types: t } = api;

  function inlineEnvVar(memberPath) {
    const node = memberPath.node;
    if (!isProcessEnv(node.object)) return;

    const key = staticKey(node);
    if (!key) return;
    if (!(key in envVars) && !APP_ENV_KEYS.includes(key)) return;

    const value = envVars[key];
    memberPath.replaceWith(
      value ? t.stringLiteral(value) : t.unaryExpression('void', t.numericLiteral(0)),
    );
    memberPath.skip();
  }

  return {
    name: 'toth-inline-env',
    visitor: {
      MemberExpression: inlineEnvVar,
      OptionalMemberExpression: inlineEnvVar,
    },
  };
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['nativewind/babel', inlineEnvPlugin],
};
