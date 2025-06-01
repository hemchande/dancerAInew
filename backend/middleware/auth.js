const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  apiKey: "AIzaSyBS3ysLaF2J9uhMHFV1Lf7P9d-R3IhHVis",
  authDomain: "connectarts-4ce5e.firebaseapp.com",
  projectId: "connectarts-4ce5e",
  storageBucket: "connectarts-4ce5e.appspot.com", // <-- fixed `.app` typo
  messagingSenderId: "992637748222",
  appId: "1:992637748222:web:6766064ee5ec1e6e2c76af",
  measurementId: "G-YHW5Y6ET8F"
});

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = auth; 