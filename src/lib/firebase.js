import firebaseSdk from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';
import { getFirebaseConfig } from './firebaseConfig';

const { config, missingKeys } = getFirebaseConfig(import.meta.env);

export const firebaseSetup = {
  config,
  missingKeys,
  sdkAvailable: true,
};

export const firebaseReady = missingKeys.length === 0;

let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let analytics = null;

if (firebaseReady) {
  app = firebaseSdk.apps?.length
    ? firebaseSdk.app()
    : firebaseSdk.initializeApp(config);
  auth = firebaseSdk.auth();
  db = firebaseSdk.firestore();
  if (config.measurementId && typeof window !== 'undefined') {
    firebaseSdk.analytics.isSupported()
      .then((supported) => {
        if (supported) analytics = firebaseSdk.analytics();
      })
      .catch(() => {});
  }
  googleProvider = new firebaseSdk.auth.GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

export function serverTimestamp() {
  return firebaseSdk ? firebaseSdk.firestore.FieldValue.serverTimestamp() : new Date();
}

export { analytics, app as firebaseApp, auth, db, googleProvider };
