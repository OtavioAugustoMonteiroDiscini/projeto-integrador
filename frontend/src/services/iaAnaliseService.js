import api from './api';

export const iaAnaliseService = {
  /**
   * Obter análise semanal de IA
   */
  getAnaliseSemanal: async (params = {}) => {
    const response = await api.get('/ia-analise/semanal', { params });
    return response.data.analise;
  }
};

