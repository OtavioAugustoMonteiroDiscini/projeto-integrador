import api from './api';

export const alertaService = {
  async listar(params = {}) {
    const response = await api.get('/alertas', { params });
    return response.data;
  },

  async buscar(id) {
    const response = await api.get(`/alertas/${id}`);
    return response.data;
  },

  async criar(dados) {
    const response = await api.post('/alertas', dados);
    return response.data;
  },

  async marcarComoLido(id) {
    const response = await api.patch(`/alertas/${id}/lido`);
    return response.data;
  },

  async marcarTodosComoLidos() {
    const response = await api.patch('/alertas/marcar-todos-lidos');
    return response.data;
  },

  async excluir(id) {
    const response = await api.delete(`/alertas/${id}`);
    return response.data;
  },

  async excluirLidos() {
    const response = await api.delete('/alertas/lidos');
    return response.data;
  },

  async estatisticas() {
    const response = await api.get('/alertas/estatisticas');
    return response.data;
  },

  async verificar() {
    const response = await api.get('/alertas/verificar');
    return response.data;
  },

  async contarNaoLidos() {
    const response = await api.get('/alertas/estatisticas');
    return response.data.alertasNaoLidos || 0;
  }
};
