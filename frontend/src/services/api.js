//  frontend/src/services/api.js

import axios from 'axios';

// API base URL from environment variables or default to localhost if not set
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for handling request errors
api.interceptors.request.use(
  (config) => {
    // Do something before request is sent
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    // Do something with request error
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling response errors
api.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx
    return response;
  },
  (error) => {
    // Any status codes outside the range of 2xx
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response Error:', error.request);
      error.message = 'No response from server. Please check if the server is running.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Function to get ICU mortality prediction
export const getPrediction = async (values) => {
  try {
    const response = await api.post('/predict', values);
    return response.data;
  } catch (error) {
    console.error('Error fetching prediction:', error);
    throw error;
  }
};

// Function to get ICU data analysis results from R script
export const getAnalysis = async (values) => {
  try {
    const response = await api.post('/analyze', values);
    return response.data;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    throw error;
  }
};

// Function to check model training status
export const checkModelStatus = async () => {
  try {
    const response = await api.get('/train_status');
    return response.data;
  } catch (error) {
    console.error('Error checking model status:', error);
    throw new Error('Unable to check model status');
  }
};

// Function to fetch system health status
export const getSystemHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error fetching system health:', error);
    throw new Error('Unable to fetch system health');
  }
};

// Function to test API connectivity
export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    return {
      connected: true,
      details: response.data
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};

export default api;
