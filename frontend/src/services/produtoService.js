import api from './api';

export const produtoService = {
  async listar(params = {}) {
    const response = await api.get('/produtos', { params });
    return response.data;
  },

  async buscar(id) {
    const response = await api.get(`/produtos/${id}`);
    return response.data.produto;
  },

  async criar(produtoData) {
    const response = await api.post('/produtos', produtoData);
    return response.data;
  },

  async atualizar(id, produtoData) {
    const response = await api.put(`/produtos/${id}`, produtoData);
    return response.data;
  },

  async excluir(id) {
    const response = await api.delete(`/produtos/${id}`);
    return response.data;
  },

  async produtosEstoqueBaixo() {
    const response = await api.get('/produtos/estoque-baixo');
    return response.data.produtos;
  },

  async atualizarEstoque(id, quantidade, operacao) {
    const response = await api.patch(`/produtos/${id}/estoque`, {
      quantidade,
      operacao
    });
    return response.data;
  },

  async alternarStatus(id) {
    const response = await api.patch(`/produtos/${id}/status`);
    return response.data;
  }
};

