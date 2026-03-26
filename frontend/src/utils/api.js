import axios from 'axios';

// Get API URL from environment or use default
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, ''); // Remove trailing slash

console.log('🔗 API Base URL:', API_URL); // Debug log

// Create an axios instance with the base URL set from environment variables
const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to include authorization token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('📤 API Request:', config.method?.toUpperCase(), config.url); // Debug log
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('❌ API Error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            url: error.config?.url,
            method: error.config?.method
        });
        
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/customer-login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
