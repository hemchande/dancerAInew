import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import config from './config/config';

// Initialize Firebase
const app = initializeApp(config.FIREBASE_CONFIG);
export const auth = getAuth(app);

export default app; 