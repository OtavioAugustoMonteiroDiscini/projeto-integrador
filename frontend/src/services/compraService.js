import api from './api';

export const compraService = {
  async listar(params = {}) {
    const response = await api.get('/compras', { params });
    return response.data;
  },

  async buscar(id) {
    const response = await api.get(`/compras/${id}`);
    return response.data.compra;
  },

  async criar(compraData) {
    const response = await api.post('/compras', compraData);
    return response.data;
  },

  async atualizarStatus(id, statusData) {
    const response = await api.patch(`/compras/${id}/status`, statusData);
    return response.data;
  },

  async cancelar(id) {
    const response = await api.patch(`/compras/${id}/cancelar`);
    return response.data;
  },

  async excluir(id) {
    const response = await api.delete(`/compras/${id}`);
    return response.data;
  },

  async relatorio(params = {}) {
    const response = await api.get('/compras/relatorio', { params });
    return response.data;
  }
};
