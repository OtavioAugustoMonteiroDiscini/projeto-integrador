import api from './api';

export const dashboardService = {
  async getDashboard() {
    const response = await api.get('/dashboard');
    return response.data;
  },

  async getVendasPorPeriodo(params = {}) {
    const response = await api.get('/dashboard/vendas-periodo', { params });
    return response.data;
  },

  async getProdutosMaisVendidos(params = {}) {
    const response = await api.get('/dashboard/produtos-mais-vendidos', { params });
    return response.data;
  },

  async getVendasPorFormaPagamento(params = {}) {
    const response = await api.get('/dashboard/vendas-forma-pagamento', { params });
    return response.data;
  },

  async getFluxoCaixa(params = {}) {
    const response = await api.get('/dashboard/fluxo-caixa', { params });
    return response.data;
  },

  async getEstatisticasEstoque() {
    const response = await api.get('/dashboard/estoque');
    return response.data;
  },

  async getComparativoMensal(params = {}) {
    const response = await api.get('/dashboard/comparativo-mensal', { params });
    return response.data;
  },

  async getVendasVsCompras(params = {}) {
    const response = await api.get('/dashboard/vendas-vs-compras', { params });
    return response.data;
  },

  async getContasPagarVsReceber(params = {}) {
    const response = await api.get('/dashboard/contas-pagar-vs-receber', { params });
    return response.data;
  }
};

