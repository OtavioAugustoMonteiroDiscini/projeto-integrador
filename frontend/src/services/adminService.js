import api from './api';

export const adminService = {
  async getEstatisticas() {
    const response = await api.get('/admin/estatisticas');
    return response.data;
  },

  async listarEmpresas(params = {}) {
    const response = await api.get('/admin/empresas', { params });
    return response.data;
  },

  async buscarEmpresa(id) {
    const response = await api.get(`/admin/empresas/${id}`);
    return response.data;
  },

  async criarEmpresa(dados) {
    const response = await api.post('/admin/empresas', dados);
    return response.data;
  },

  async atualizarEmpresa(id, dados) {
    const response = await api.put(`/admin/empresas/${id}`, dados);
    return response.data;
  },

  async excluirEmpresa(id) {
    const response = await api.delete(`/admin/empresas/${id}`);
    return response.data;
  }
};
