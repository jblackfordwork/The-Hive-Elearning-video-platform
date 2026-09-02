const FIREBASE_ENV_MAP = {
  VITE_FIREBASE_API_KEY: 'apiKey',
  VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
  VITE_FIREBASE_PROJECT_ID: 'projectId',
  VITE_FIREBASE_STORAGE_BUCKET: 'storageBucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'messagingSenderId',
  VITE_FIREBASE_APP_ID: 'appId',
};

const FIREBASE_ENV_DEFAULTS = {
  VITE_FIREBASE_API_KEY: 'AIzaSyCIbBXxx1Y96JgytVeCJtrinYryzCsV2S0',
  VITE_FIREBASE_AUTH_DOMAIN: 'the-hive-elearning-courses.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'the-hive-elearning-courses',
  VITE_FIREBASE_STORAGE_BUCKET: 'the-hive-elearning-courses.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '256693232794',
  VITE_FIREBASE_APP_ID: '1:256693232794:web:5a3c73f98c853ee20ceb23',
};

const OPTIONAL_FIREBASE_ENV_MAP = {
  VITE_FIREBASE_MEASUREMENT_ID: 'measurementId',
};

const OPTIONAL_FIREBASE_ENV_DEFAULTS = {
  VITE_FIREBASE_MEASUREMENT_ID: 'G-0RDYH5VWTM',
};

export function getFirebaseConfig(env = {}, { useDefaults = true } = {}) {
  const defaults = useDefaults ? FIREBASE_ENV_DEFAULTS : {};
  const optionalDefaults = useDefaults ? OPTIONAL_FIREBASE_ENV_DEFAULTS : {};
  const missingKeys = Object.keys(FIREBASE_ENV_MAP).filter(
    (key) => !String(env[key] ?? defaults[key] ?? '').trim(),
  );

  const config = Object.entries(FIREBASE_ENV_MAP).reduce(
    (result, [envKey, firebaseKey]) => {
      result[firebaseKey] = String(env[envKey] ?? defaults[envKey] ?? '').trim();
      return result;
    },
    {},
  );

  Object.entries(OPTIONAL_FIREBASE_ENV_MAP).forEach(([envKey, firebaseKey]) => {
    const value = String(env[envKey] ?? optionalDefaults[envKey] ?? '').trim();
    if (value) config[firebaseKey] = value;
  });

  return { config, missingKeys };
}
