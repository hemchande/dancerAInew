import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBS3ysLaF2J9uhMHFV1Lf7P9d-R3IhHVis",
  authDomain: "connectarts-4ce5e.firebaseapp.com",
  projectId: "connectarts-4ce5e",
  storageBucket: "connectarts-4ce5e.appspot.com", // <-- fixed `.app` typo
  messagingSenderId: "992637748222",
  appId: "1:992637748222:web:6766064ee5ec1e6e2c76af",
  measurementId: "G-YHW5Y6ET8F"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const registerWithEmailAndPassword = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in MongoDB
    const response = await fetch('http://localhost:8000/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        ...userData
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create user profile');
    }

    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth }; 