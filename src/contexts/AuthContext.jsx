import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthToken = async () => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await getAuthToken();
          console.log(token)
          // Get user profile from backend
          const response = await axios.get(`http://localhost:8000/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          console.log(response.data)
          console.log(firebaseUser)
          setUser({ ...firebaseUser, ...response.data });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // If profile doesn't exist, create it
          try {
            const token = await getAuthToken();
            const response = await axios.post('http://localhost:8000/auth/register', {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              role: 'performer',
              genre: 'Ballet',
              skill_level: 'Beginner',
              techniques_to_improve: []
            }, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            setUser({ ...firebaseUser, ...response.data });
          } catch (registerError) {
            console.error('Error creating user profile:', registerError);
            setUser(firebaseUser);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const token = await getAuthToken();

      // Register user in backend
      await axios.post('http://localhost:8000/auth/register', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userData
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return true;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    getAuthToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 