import api from './api';

export const contaReceberService = {
  async listar(params = {}) {
    const response = await api.get('/contas-receber', { params });
    return response.data;
  },

  async buscar(id) {
    const response = await api.get(`/contas-receber/${id}`);
    return response.data.conta;
  },

  async criar(contaData) {
    const response = await api.post('/contas-receber', contaData);
    return response.data;
  },

  async atualizar(id, contaData) {
    const response = await api.put(`/contas-receber/${id}`, contaData);
    return response.data;
  },

  async marcarComoRecebida(id, dataRecebimento) {
    const response = await api.patch(`/contas-receber/${id}/receber`, { dataRecebimento });
    return response.data;
  },

  async excluir(id) {
    const response = await api.delete(`/contas-receber/${id}`);
    return response.data;
  },

  async relatorio(params = {}) {
    const response = await api.get('/contas-receber/relatorio', { params });
    return response.data;
  }
};
