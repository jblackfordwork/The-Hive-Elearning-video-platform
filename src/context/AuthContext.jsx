/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from 'react';
import { auth, db, firebaseReady, googleProvider } from '../lib/firebase';
import { isEmailAllowed, DOMAIN_ACCESS_MESSAGE } from '../domain/access';
import { ensureUserProfile } from '../services/userService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(firebaseReady);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setLoading(false);
      return undefined;
    }

    let unsubscribeProfile = null;
    const unsubscribeAuth = auth.onAuthStateChanged(async (nextUser) => {
      setLoading(true);
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!nextUser.emailVerified || !isEmailAllowed(nextUser.email) || !nextUser.providerData.some((provider) => provider.providerId === 'google.com')) {
        setUser(null);
        setProfile(null);
        setAuthError(DOMAIN_ACCESS_MESSAGE);
        try {
          await auth.signOut();
        } catch {
          // Keep access blocked locally even if sign-out cannot reach Firebase.
        }
        setLoading(false);
        return;
      }

      try {
        setUser(nextUser);
        await ensureUserProfile(nextUser);
        unsubscribeProfile = db.collection('users').doc(nextUser.uid).onSnapshot((snapshot) => {
          setProfile(snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null);
          setLoading(false);
        }, (error) => {
          setAuthError(error.message || 'Unable to load your Hive profile.');
          setLoading(false);
        });
      } catch (error) {
        setAuthError(error.message || 'Unable to complete sign in.');
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!firebaseReady || !auth || !googleProvider) {
      setAuthError('Firebase must be configured before Google sign-in can be used.');
      return;
    }
    setAuthError('');
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (error) {
      if (error?.code !== 'auth/popup-closed-by-user') {
        setAuthError(error.message?.includes('HIVE_DOMAIN_NOT_ALLOWED')
          ? DOMAIN_ACCESS_MESSAGE
          : error.message || 'Google sign-in failed.');
      }
    }
  };

  const signOutUser = async () => {
    if (auth) await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      authError,
      isAuthenticated: Boolean(user),
      isAdmin: profile?.role === 'admin',
      signInWithGoogle,
      signOutUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
