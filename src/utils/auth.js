// Auth utility functions
export const getAuthToken = () => {
  // Get the Firebase user from localStorage
  const userStr = localStorage.getItem('firebaseUser');
  if (!userStr) {
    return null;
  }
  
  try {
    const user = JSON.parse(userStr);
    return user.stsTokenManager?.accessToken || null;
  } catch (error) {
    console.error('Error parsing Firebase user:', error);
    return null;
  }
};

export const setAuthToken = (user) => {
  if (!user) {
    throw new Error('Invalid user provided');
  }
  // Store the entire Firebase user object
  localStorage.setItem('firebaseUser', JSON.stringify(user));
};

export const removeAuthToken = () => {
  localStorage.removeItem('firebaseUser');
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

// Add login function
export const login = async (email, password) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    setAuthToken(data.user);
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Add register function
export const register = async (email, password, name) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    setAuthToken(data.user);
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Add token validation
export const validateToken = async () => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Token validation failed');
    }
    
    return true;
  } catch (error) {
    removeAuthToken();
    return false;
  }
}; 