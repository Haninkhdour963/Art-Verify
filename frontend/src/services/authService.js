import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Making API request:', config.method?.toUpperCase(), config.url);
  return config;
}, (error) => {
  console.error('Request error:', error);
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  async register(userData) {
    try {
      console.log('Registering user:', userData);
      
      // Enhanced client-side validation
      const validationError = this.validateRegistration(userData);
      if (validationError) {
        throw new Error(validationError);
      }

      const response = await api.post('/auth/register', userData);
      console.log('Registration successful:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Token saved to localStorage');
      }
      return response.data;
    } catch (error) {
      console.error('Registration error details:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  },

  async login(credentials) {
    try {
      console.log('Logging in user:', credentials.email);
      
      // Enhanced client-side validation
      const validationError = this.validateLogin(credentials);
      if (validationError) {
        throw new Error(validationError);
      }

      const response = await api.post('/auth/login', credentials);
      console.log('Login successful:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Token saved to localStorage');
      }
      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('User logged out');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  },

  validateRegistration(userData) {
    // Role validation
    if (!userData.role || (userData.role !== 'Seller' && userData.role !== 'Buyer')) {
      return 'Role must be either "Seller" or "Buyer"';
    }

    // Username validation
    if (!userData.username || userData.username.length < 3) {
      return 'Username must be at least 3 characters long';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!userData.email) {
      return 'Email is required';
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(userData.email)) {
      return 'Please enter a valid email address';
    }

    // Password validation
    if (!userData.password || userData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(userData.password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    return null;
  },

  validateLogin(credentials) {
    // Email validation
    if (!credentials.email) {
      return 'Email is required';
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(credentials.email)) {
      return 'Please enter a valid email address';
    }

    // Password validation
    if (!credentials.password) {
      return 'Password is required';
    }

    return null;
  },

  // Check if user has specific role
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  },

  // Check if user is seller
  isSeller() {
    return this.hasRole('Seller');
  },

  // Check if user is buyer
  isBuyer() {
    return this.hasRole('Buyer');
  }
};

export default authService;