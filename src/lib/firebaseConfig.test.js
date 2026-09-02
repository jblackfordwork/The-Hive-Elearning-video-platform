import test from 'node:test';
import assert from 'node:assert/strict';
import { getFirebaseConfig } from './firebaseConfig.js';

const completeEnv = {
  VITE_FIREBASE_API_KEY: 'api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'hive.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'hive',
  VITE_FIREBASE_STORAGE_BUCKET: 'hive.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
  VITE_FIREBASE_APP_ID: '1:123:web:abc',
};

test('reports every missing required Firebase environment key', () => {
  const result = getFirebaseConfig({ VITE_FIREBASE_API_KEY: 'api-key' }, { useDefaults: false });
  assert.deepEqual(result.missingKeys, [
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ]);
});

test('normalizes complete Vite environment variables into Firebase config', () => {
  const result = getFirebaseConfig(completeEnv, { useDefaults: false });
  assert.deepEqual(result.missingKeys, []);
  assert.deepEqual(result.config, {
    apiKey: 'api-key',
    authDomain: 'hive.firebaseapp.com',
    projectId: 'hive',
    storageBucket: 'hive.appspot.com',
    messagingSenderId: '123',
    appId: '1:123:web:abc',
  });
});

test('includes optional Firebase measurement ID without requiring it', () => {
  const result = getFirebaseConfig({
    ...completeEnv,
    VITE_FIREBASE_MEASUREMENT_ID: 'G-ABC123',
  }, { useDefaults: false });
  assert.deepEqual(result.missingKeys, []);
  assert.equal(result.config.measurementId, 'G-ABC123');
});

test('uses The Hive Firebase defaults when environment values are absent', () => {
  const result = getFirebaseConfig({});
  assert.deepEqual(result.missingKeys, []);
  assert.equal(result.config.projectId, 'the-hive-elearning-courses');
  assert.equal(result.config.appId, '1:256693232794:web:5a3c73f98c853ee20ceb23');
  assert.equal(result.config.measurementId, 'G-0RDYH5VWTM');
});

test('normalizes values pasted with their GitHub variable names', () => {
  const result = getFirebaseConfig({
    VITE_FIREBASE_API_KEY: 'VITE_FIREBASE_API_KEY = api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'VITE_FIREBASE_AUTH_DOMAIN = hive.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'VITE_FIREBASE_PROJECT_ID = hive',
    VITE_FIREBASE_STORAGE_BUCKET: 'VITE_FIREBASE_STORAGE_BUCKET = hive.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: 'VITE_FIREBASE_MESSAGING_SENDER_ID = 123',
    VITE_FIREBASE_APP_ID: 'VITE_FIREBASE_APP_ID = 1:123:web:abc',
    VITE_FIREBASE_MEASUREMENT_ID: 'VITE_FIREBASE_MEASUREMENT_ID = G-ABC123',
  }, { useDefaults: false });

  assert.deepEqual(result.missingKeys, []);
  assert.deepEqual(result.config, {
    apiKey: 'api-key',
    authDomain: 'hive.firebaseapp.com',
    projectId: 'hive',
    storageBucket: 'hive.appspot.com',
    messagingSenderId: '123',
    appId: '1:123:web:abc',
    measurementId: 'G-ABC123',
  });
});
