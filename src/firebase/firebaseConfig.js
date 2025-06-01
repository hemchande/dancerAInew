import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

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
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export default app;
