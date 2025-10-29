import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with optimized settings
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Cache-Control': 'no-cache'
  }
});

// Request cache with enhanced performance
const requestCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Request interceptor with performance tracking
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add cache busting for GET requests
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: Date.now() // Cache busting
    };
  }
  
  return config;
}, (error) => {
  console.error('❌ Request error:', error);
  return Promise.reject(error);
});

// Response interceptor with enhanced error handling and performance
api.interceptors.response.use(
  (response) => {
    // Log performance for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to server. Please check if the backend is running.');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    throw new Error(errorMessage);
  }
);

// Enhanced cache management
const cacheManager = {
  set: (key, data) => {
    // Clear old cache entries if cache is too large
    if (requestCache.size > 100) {
      const keys = Array.from(requestCache.keys());
      for (let i = 0; i < 20; i++) {
        requestCache.delete(keys[i]);
      }
    }
    
    requestCache.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
  get: (key) => {
    const cached = requestCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      requestCache.delete(key);
      return null;
    }
    
    return cached.data;
  },
  
  clear: (pattern) => {
    if (pattern) {
      for (const key of requestCache.keys()) {
        if (key.includes(pattern)) {
          requestCache.delete(key);
        }
      }
    } else {
      requestCache.clear();
    }
  }
};

// Normalize artwork data function with performance optimizations
const normalizeArtworkData = (artwork) => {
  if (!artwork) return artwork;
  
  let imageUrl = artwork.imageUrl || '';
  
  if (!imageUrl && artwork.imagePath) {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Optimized path parsing
    const pathParts = artwork.imagePath.split('/');
    if (pathParts.length >= 4 && pathParts[0] === 'images' && pathParts[1] === 'artworks') {
      const artworkId = pathParts[2];
      const fileName = pathParts[3];
      imageUrl = `${baseUrl}/api/artworks/image/${artworkId}/${fileName}`;
    } else {
      imageUrl = `${baseUrl}/${artwork.imagePath.replace(/^\/+/, '')}`;
    }
  }
  
  return {
    ...artwork,
    sha256Hash: artwork.sha256Hash || artwork.SHA256Hash || '',
    fileName: artwork.fileName || `artwork-${artwork.id}`,
    fileType: artwork.fileType || 'image/jpeg',
    fileSize: artwork.fileSize || 0,
    imageUrl: imageUrl,
    transactionId: artwork.transactionId || 'NOT_REGISTERED',
    isListedForSale: artwork.isListedForSale || false,
    salePrice: artwork.salePrice || null,
    createdAt: artwork.createdAt,
    user: artwork.user || { username: 'Unknown', email: 'Unknown', role: 'Unknown' }
  };
};

export const artService = {
  async uploadArtwork(formData) {
    try {
      console.log('📤 Uploading artwork...');
      
      // Validate form data
      if (!formData) {
        throw new Error('Form data cannot be empty');
      }
      
      const file = formData.get('file');
      if (!file) {
        throw new Error('No file selected for upload');
      }

      const response = await api.post('/artworks/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });
      
      console.log('✅ Upload successful');
      
      // Normalize the response data
      const normalizedArtwork = normalizeArtworkData(response.data);
      
      // Clear relevant caches
      cacheManager.clear('user_artworks');
      cacheManager.clear('marketplace');
      
      return normalizedArtwork;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      
      let errorMessage = 'Upload failed. Please try again.';
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid file or upload data';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to upload artworks';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else {
        errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      }
      
      throw new Error(errorMessage);
    }
  },

  async verifyByFile(file) {
    try {
      if (!file) {
        throw new Error('Please select a file to verify');
      }

      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/artworks/verify', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.artwork) {
        response.data.artwork = normalizeArtworkData(response.data.artwork);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Verification failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed';
      throw new Error(errorMessage);
    }
  },

  async verifyByHash(hash) {
    try {
      if (!hash || hash.trim() === '') {
        throw new Error('Please enter a hash to verify');
      }

      const cacheKey = `verify_hash_${hash}`;
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;

      const formData = new FormData();
      formData.append('fileHash', hash.trim());
      
      const response = await api.post('/artworks/verify', formData);
      
      if (response.data.artwork) {
        response.data.artwork = normalizeArtworkData(response.data.artwork);
      }
      
      cacheManager.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Verification failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed';
      throw new Error(errorMessage);
    }
  },

  async verifyByTransactionId(transactionId) {
    try {
      if (!transactionId || transactionId.trim() === '') {
        throw new Error('Please enter a transaction ID to verify');
      }

      const cacheKey = `verify_tx_${transactionId}`;
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;

      const formData = new FormData();
      formData.append('transactionId', transactionId.trim());
      
      const response = await api.post('/artworks/verify', formData);
      
      if (response.data.artwork) {
        response.data.artwork = normalizeArtworkData(response.data.artwork);
      }
      
      cacheManager.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Verification failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed';
      throw new Error(errorMessage);
    }
  },

  async getUserArtworks() {
    try {
      const cacheKey = 'user_artworks';
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;

      const response = await api.get('/artworks/user');
      
      const artworks = response.data.map(artwork => normalizeArtworkData(artwork));
      cacheManager.set(cacheKey, artworks);
      
      return artworks;
    } catch (error) {
      console.error('❌ Failed to load artworks:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load artworks';
      throw new Error(errorMessage);
    }
  },

  async getPurchasedArtworks() {
    try {
      const cacheKey = 'purchased_artworks';
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;

      const response = await api.get('/artworks/purchased');
      
      const artworks = response.data.map(artwork => normalizeArtworkData(artwork));
      cacheManager.set(cacheKey, artworks);
      
      return artworks;
    } catch (error) {
      console.error('❌ Failed to load purchased artworks:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load purchased artworks';
      throw new Error(errorMessage);
    }
  },

  async getMarketplaceArtworks() {
    try {
      const cacheKey = 'marketplace_artworks';
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;

      const response = await api.get('/artworks/marketplace');
      
      const artworks = response.data.map(artwork => normalizeArtworkData(artwork));
      cacheManager.set(cacheKey, artworks);
      
      return artworks;
    } catch (error) {
      console.error('❌ Failed to load marketplace:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load marketplace';
      throw new Error(errorMessage);
    }
  },

  async listForSale(artworkId, price) {
    try {
      if (!artworkId || artworkId <= 0) {
        throw new Error('Invalid artwork ID');
      }

      if (!price || price <= 0) {
        throw new Error('Invalid price');
      }

      const response = await api.post(`/artworks/${artworkId}/list`, { price });
      
      // Clear relevant caches
      cacheManager.clear('user_artworks');
      cacheManager.clear('marketplace');
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to list for sale:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to list for sale';
      throw new Error(errorMessage);
    }
  },

  async purchaseArtwork(artworkId) {
    try {
      if (!artworkId || artworkId <= 0) {
        throw new Error('Invalid artwork ID');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to complete the purchase');
      }

      const response = await api.post(`/artworks/${artworkId}/purchase`);
      
      // Clear relevant caches
      cacheManager.clear('marketplace');
      cacheManager.clear('purchased_artworks');
      cacheManager.clear('user_artworks');
      
      return response.data;
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      
      let errorMessage = 'Purchase failed';
      if (error.response?.status === 404) {
        errorMessage = 'Artwork not found or already sold';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Cannot purchase your own artwork';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to complete the purchase';
      } else if (error.response?.status === 403) {
        errorMessage = 'Only buyers can purchase artworks';
      } else {
        errorMessage = error.response?.data?.message || error.message || 'Purchase failed';
      }
      
      throw new Error(errorMessage);
    }
  },

  async downloadArtwork(artworkId) {
    try {
      if (!artworkId || artworkId <= 0) {
        throw new Error('Invalid artwork ID');
      }

      const response = await api.get(`/artworks/${artworkId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Download failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Download failed';
      throw new Error(errorMessage);
    }
  },

 async getSellerStats() {
  try {
    const cacheKey = 'seller_stats';
    const cached = cacheManager.get(cacheKey);
    if (cached) return cached;

    const response = await api.get('/artworks/seller-stats');
    cacheManager.set(cacheKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get seller stats:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to get seller stats';
    throw new Error(errorMessage);
  }
},

  clearCache: () => {
    cacheManager.clear();
  },

  clearCacheByPattern: (pattern) => {
    cacheManager.clear(pattern);
  }
};

export default artService;