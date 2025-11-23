import api from './api';

export const vendaService = {
  async listar(params = {}) {
    const response = await api.get('/vendas', { params });
    return response.data;
  },

  async buscar(id) {
    const response = await api.get(`/vendas/${id}`);
    return response.data.venda;
  },

  async criar(vendaData) {
    const response = await api.post('/vendas', vendaData);
    return response.data;
  },

  async atualizar(id, vendaData) {
    const response = await api.put(`/vendas/${id}`, vendaData);
    return response.data;
  },

  async atualizarStatus(id, statusData) {
    const response = await api.patch(`/vendas/${id}/status`, statusData);
    return response.data;
  },

  async cancelar(id) {
    const response = await api.patch(`/vendas/${id}/cancelar`);
    return response.data;
  },

  async excluir(id) {
    const response = await api.delete(`/vendas/${id}`);
    return response.data;
  },

  async relatorio(params = {}) {
    const response = await api.get('/vendas/relatorio', { params });
    return response.data;
  }
};

