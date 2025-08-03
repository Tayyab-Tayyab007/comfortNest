/**
 * ComfortNest - API Client Module
 *
 * Centralized API communication layer for the ComfortNest application.
 * Provides a clean interface for all frontend-backend communication.
 *
 * FEATURES:
 * - Centralized API request handling
 * - Automatic JWT token management
 * - Error handling and response parsing
 * - User authentication methods
 * - Property CRUD operations
 * - File upload handling
 * - Admin and user role management
 *
 * API ENDPOINTS:
 * - User: /api/users (register, login, profile, management)
 * - Properties: /api/properties (CRUD operations)
 * - Authentication: JWT token-based auth
 * - File uploads: Property image handling
 *
 * ERROR HANDLING:
 * - Network error detection
 * - JSON parsing error handling
 * - HTTP status code handling
 * - User-friendly error messages
 *
 * SECURITY:
 * - JWT token storage in localStorage
 * - Automatic token inclusion in requests
 * - Admin vs user token differentiation
 * - Secure logout functionality
 *
 * @author ComfortNest Development Team
 * @version 1.0.0
 */

// ======== API CONFIGURATION ========
const API_URL = '/api';         // Base URL for all API endpoints

// ======== CORE API FUNCTIONS ========

/**
 * Helper function to make standardized API requests
 * Handles authentication, error handling, and response parsing
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object|null} data - Request body data
 * @param {boolean} includeToken - Whether to include auth token
 * @param {boolean} useAdminToken - Whether to use admin token
 * @returns {Promise<Object>} API response data
 */
async function apiRequest(endpoint, method = 'GET', data = null, includeToken = false, useAdminToken = false) {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Include authorization token if needed
  if (includeToken) {
    const token = useAdminToken ? localStorage.getItem('adminToken') : localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Redirect to login if token doesn't exist
      if (useAdminToken) {
        console.log('Admin token not found, showing login');
        return Promise.reject(new Error('Admin authentication required'));
      } else {
        window.location.href = '/login.html';
        return;
      }
    }
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    console.log('Making API request:', `${API_URL}${endpoint}`, config);
    const response = await fetch(`${API_URL}${endpoint}`, config);
    console.log('API response status:', response.status);

    // Handle different response types
    let responseData;
    try {
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
        console.log('API response data:', responseData);
      } else {
        // If not JSON, get text response
        const responseText = await response.text();
        console.log('API response text:', responseText);

        if (responseText.includes('<!DOCTYPE')) {
          // HTML error page received
          responseData = {
            message: `Server error (${response.status}). Please check server logs.`,
            error: 'HTML_ERROR_PAGE'
          };
        } else {
          responseData = { message: responseText || 'Unknown error occurred' };
        }
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      responseData = {
        message: `Server error (${response.status}). Unable to parse response.`,
        error: 'PARSE_ERROR'
      };
    }

    if (!response.ok) {
      throw new Error(responseData.message || 'An error occurred');
    }

    return responseData;
  } catch (error) {
    console.error('API Error:', error);
    console.error('Full error details:', error.message);
    console.error('Request details:', { endpoint, method, includeToken, useAdminToken });

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server');
    }

    // Preserve the original error for proper handling upstream
    throw error;
  }
}

// User API Functions
const userAPI = {
  register: async (userData) => {
    return apiRequest('/users/register', 'POST', userData);
  },

  login: async (credentials) => {
    const response = await apiRequest('/users/login', 'POST', credentials);
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  faceLogin: async (credentials) => {
    const response = await apiRequest('/users/face-login', 'POST', credentials);
    // Store token in localStorage if successful
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  resetPassword: async (data) => {
    try {
      console.log('Resetting password for:', data.email);
      // Use the actual API endpoint for password reset
      return apiRequest('/users/reset-password', 'POST', data);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  checkFaceDuplicate: async (faceFeatures) => {
    return apiRequest('/users/check-face-duplicate', 'POST', { faceFeatures, threshold: 0.85 });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  },

  getProfile: async () => {
    return apiRequest('/users/profile', 'GET', null, true);
  },

  updateProfile: async (userData) => {
    return apiRequest('/users/profile', 'PUT', userData, true);
  },

  getAllUsers: async () => {
    return apiRequest('/users', 'GET', null, true, true); // Use admin token
  },

  createUser: async (userData) => {
    return apiRequest('/users', 'POST', userData, true, true); // Use admin token
  },

  updateUser: async (userId, userData) => {
    console.log('API: Updating user', userId, 'with data:', userData);
    try {
      const result = await apiRequest(`/users/${userId}`, 'PUT', userData, true, true); // Use admin token
      console.log('API: User update successful:', result);
      return result;
    } catch (error) {
      console.error('API: User update failed:', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    return apiRequest(`/users/${userId}`, 'DELETE', null, true, true); // Use admin token
  }
};

// Property API Functions
const propertyAPI = {
  getAllProperties: async (queryParams = '') => {
    return apiRequest(`/properties${queryParams}`);
  },

  getProperty: async (id) => {
    return apiRequest(`/properties/${id}`);
  },

  createProperty: async (propertyData) => {
    return apiRequest('/properties', 'POST', propertyData, true);
  },

  updateProperty: async (id, propertyData) => {
    return apiRequest(`/properties/${id}`, 'PUT', propertyData, true);
  },

  deleteProperty: async (id) => {
    return apiRequest(`/properties/${id}`, 'DELETE', null, true, true); // Use admin token
  },

  uploadImages: async (propertyId, formData) => {
    const headers = {}; // FormData handles Content-Type automatically
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      window.location.href = '/login.html';
      return;
    }

    try {
      const response = await fetch(`${API_URL}/properties/${propertyId}/images`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to upload images');
      }
      return responseData;
    } catch (error) {
      console.error('Image Upload Error:', error);
      throw error;
    }
  }
};

// Check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
}

// Update UI based on authentication status
function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const userMenu = document.getElementById('user-menu-container');
  if (!userMenu) return;

  if (loggedIn) {
    const user = getCurrentUser();
    userMenu.innerHTML = `
      <div class="user-dropdown" tabindex="0">
        <span class="user-icon"><i class="fa fa-user-circle"></i> ${user && user.name ? user.name.split(' ')[0] : 'Account'} <i class="fa fa-caret-down"></i></span>
        <ul class="dropdown-menu">
          <li><a href="/dashboard.html">Dashboard</a></li>
          <li><button id="logout-btn" class="dropdown-logout">Logout</button></li>
        </ul>
      </div>
    `;
    // Dropdown toggle
    const dropdown = userMenu.querySelector('.user-dropdown');
    const menu = userMenu.querySelector('.dropdown-menu');
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      menu.classList.remove('show');
    });
    // Logout event
    document.getElementById('logout-btn').addEventListener('click', userAPI.logout);
  } else {
    // Updated login/register links with proper styling
    userMenu.innerHTML = `
      <div class="login-register-links">
        <a href="/login.html" class="nav-link">Login</a>
        <a href="/sign up.html" class="nav-link">Register</a>
      </div>
    `;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  
  // Mobile menu is now handled by navbar.js - removed duplicate code
});

// Export the API
window.userAPI = userAPI;
window.propertyAPI = propertyAPI;