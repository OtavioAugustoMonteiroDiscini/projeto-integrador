import api from './api';

export const authService = {
  async login(email, senha) {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  },

  async register(empresaData) {
    const response = await api.post('/auth/register', empresaData);
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data.empresa;
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    return response.data.empresa;
  },

  async changePassword(passwordData) {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  }
};

