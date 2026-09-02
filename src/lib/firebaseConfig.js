const FIREBASE_ENV_MAP = {
  VITE_FIREBASE_API_KEY: 'apiKey',
  VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
  VITE_FIREBASE_PROJECT_ID: 'projectId',
  VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
  VITE_FIREBASE_APP_ID: 'appId',
};

const OPTIONAL_FIREBASE_ENV_MAP = {
  VITE_FIREBASE_MEASUREMENT_ID: 'measurementId',
};

export function getFirebaseConfig(env = {}) {
  const missingKeys = Object.keys(FIREBASE_ENV_MAP).filter(
    (key) => !String(env[key] ?? '').trim(),
  );

  const config = Object.entries(FIREBASE_ENV_MAP).reduce(
    (result, [envKey, firebaseKey]) => {
      result[firebaseKey] = String(env[envKey] ?? '').trim();
      return result;
    },
    {},
  );

  Object.entries(OPTIONAL_FIREBASE_ENV_MAP).forEach(([envKey, firebaseKey]) => {
    const value = String(env[envKey] ?? '').trim();
    if (value) config[firebaseKey] = value;
  });

  return { config, missingKeys };
}
