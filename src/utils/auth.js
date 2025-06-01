import { getAuth } from 'firebase/auth';

export const getAuthToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('No user logged in');
  }

  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw error;
  }
}; 