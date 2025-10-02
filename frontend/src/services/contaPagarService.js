import api from './api';

export const contaPagarService = {
  async listar(params = {}) {
    const response = await api.get('/contas-pagar', { params });
    return response.data;
  },

  async buscar(id) {
    const response = await api.get(`/contas-pagar/${id}`);
    return response.data.conta;
  },

  async criar(contaData) {
    const response = await api.post('/contas-pagar', contaData);
    return response.data;
  },

  async atualizar(id, contaData) {
    const response = await api.put(`/contas-pagar/${id}`, contaData);
    return response.data;
  },

  async marcarComoPaga(id, dataPagamento) {
    const response = await api.patch(`/contas-pagar/${id}/pagar`, { dataPagamento });
    return response.data;
  },

  async excluir(id) {
    const response = await api.delete(`/contas-pagar/${id}`);
    return response.data;
  },

  async relatorio(params = {}) {
    const response = await api.get('/contas-pagar/relatorio', { params });
    return response.data;
  }
};
