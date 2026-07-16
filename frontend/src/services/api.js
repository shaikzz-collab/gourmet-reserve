const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000/api' 
  : '/api';

// Helper for making API requests with JWT Auth token
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const authAPI = {
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
    }
    return data;
  },

  register: async (name, email, password, role) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: { name, email, password, role },
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    return await request('/auth/me');
  },
};

export const tableAPI = {
  getAll: async () => {
    return await request('/tables');
  },
  
  create: async (tableData) => {
    return await request('/tables', {
      method: 'POST',
      body: tableData,
    });
  },

  update: async (id, tableData) => {
    return await request(`/tables/${id}`, {
      method: 'PUT',
      body: tableData,
    });
  },

  delete: async (id) => {
    return await request(`/tables/${id}`, {
      method: 'DELETE',
    });
  },
};

export const reservationAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.date) queryParams.append('date', filters.date);
    if (filters.user) queryParams.append('user', filters.user);
    if (filters.table) queryParams.append('table', filters.table);

    const queryString = queryParams.toString();
    return await request(`/reservations${queryString ? `?${queryString}` : ''}`);
  },

  create: async (reservationData) => {
    return await request('/reservations', {
      method: 'POST',
      body: reservationData,
    });
  },

  update: async (id, reservationData) => {
    return await request(`/reservations/${id}`, {
      method: 'PUT',
      body: reservationData,
    });
  },

  cancel: async (id) => {
    return await request(`/reservations/${id}`, {
      method: 'PUT',
      body: { status: 'cancelled' },
    });
  },
};
