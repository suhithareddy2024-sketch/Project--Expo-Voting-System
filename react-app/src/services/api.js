/**
 * Centralized API Service for Project Expo Voting System
 * Connects React frontend to Express/MongoDB backend with automatic JWT Bearer token attachment.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Helper to get clean auth token from storage
 * Ensures it's a valid non-empty string and never "undefined" or "null"
 */
export const getToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      return null;
    }
    return token.trim();
  } catch (e) {
    return null;
  }
};

/**
 * Helper to set auth token and user in storage
 */
export const setAuthSession = (token, user) => {
  if (token && token !== 'undefined' && token !== 'null') {
    localStorage.setItem('token', token.trim());
  } else {
    localStorage.removeItem('token');
  }
  if (user && typeof user === 'object') {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

/**
 * Helper to clear auth session
 */
export const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('adminLogin');
};

/**
 * Helper to get stored user
 */
export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

/**
 * Generic request wrapper with automatic Bearer token injection & JSON handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Automatically attach Bearer token if present and valid
  const token = getToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If 401 Unauthorized or 403 Forbidden, session might be invalid/expired
      if (response.status === 401) {
        clearAuthSession();
      }
      
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.status && error.name === 'TypeError') {
      const networkError = new Error('Backend server is unreachable. Please make sure the backend server is running and accessible.');
      networkError.status = 0;
      throw networkError;
    }
    throw error;
  }
}

// --------------------------------------------------------
// API ENDPOINTS
// --------------------------------------------------------

export const api = {
  // 1. Health Check
  getHealth: () => request('/health', { method: 'GET' }),

  // 2. Authentication
  register: (name, email, password, role = 'user') =>
    request('/auth/register', {
      method: 'POST',
      body: { name, email, password, role }
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password }
    }),

  // 3. Projects Management (Public Read, Protected Write)
  getProjects: () => request('/projects', { method: 'GET' }),

  getProjectById: (id) => request(`/projects/${id}`, { method: 'GET' }),

  createProject: (projectData) =>
    request('/projects', {
      method: 'POST',
      body: projectData
    }),

  updateProject: (id, projectData) =>
    request(`/projects/${id}`, {
      method: 'PUT',
      body: projectData
    }),

  deleteProject: (id) =>
    request(`/projects/${id}`, {
      method: 'DELETE'
    }),

  // 4. Voting (Protected Voter Route)
  castVote: (voteData) =>
    request('/votes', {
      method: 'POST',
      body: voteData
    }),

  checkUserVoted: (projectId) =>
    request(`/votes/check/${projectId}`, {
      method: 'GET'
    }),

  // 5. Feedback (Protected Write, Public Read)
  submitFeedback: (feedbackData) =>
    request('/feedback', {
      method: 'POST',
      body: feedbackData
    }),

  getFeedbackByProject: (projectId) =>
    request(`/feedback/${projectId}`, {
      method: 'GET'
    }),

  // 6. Results & Leaderboard (Public)
  getResults: () => request('/results', { method: 'GET' }),

  getProjectResult: (projectId) =>
    request(`/results/${projectId}`, {
      method: 'GET'
    })
};

export default api;
