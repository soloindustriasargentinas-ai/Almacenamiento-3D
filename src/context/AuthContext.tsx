import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as fbSignOut, 
  signInAnonymously 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { UserProfile, syncUserProfile, updateSubscription as updateSubDb } from '../services/dbService';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (email?: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  changeSubscription: (plan: 'free' | 'pro' | 'enterprise') => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAsGuest: async () => {},
  signOut: async () => {},
  changeSubscription: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProfile = await syncUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          });
          setProfile(userProfile);
        } catch (e) {
          console.error('Failed to sync user profile:', e);
          // Fallback basic profile
          setProfile({
            id: currentUser.uid,
            email: currentUser.email || 'usuario@industria.com',
            displayName: currentUser.displayName || 'Usuario Industrial',
            photoURL: currentUser.photoURL || '',
            subscriptionPlan: 'free',
            subscriptionStatus: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Error en Google Sign In:', err);
    }
  };

  const signInAsGuest = async (email = 'demouser@empresa.com', name = 'Operador Demo') => {
    try {
      const cred = await signInAnonymously(auth);
      if (cred.user) {
        const dummyProfile: UserProfile = {
          id: cred.user.uid,
          email,
          displayName: name,
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        try {
          await syncUserProfile({
            uid: cred.user.uid,
            email,
            displayName: name,
          });
        } catch {}
        setProfile(dummyProfile);
      }
    } catch (err: any) {
      console.error('Error al iniciar como demo:', err);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const changeSubscription = async (plan: 'free' | 'pro' | 'enterprise') => {
    if (!user) return;
    try {
      await updateSubDb(user.uid, plan);
      setProfile((prev) => prev ? { ...prev, subscriptionPlan: plan, subscriptionStatus: 'active' } : null);
    } catch (err) {
      console.error('Error al actualizar suscripción:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        changeSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
