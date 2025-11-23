const { executarAnaliseSemanal } = require('../services/iaAnaliseService');

/**
 * Obter análise semanal de produtos
 */
const obterAnaliseSemanal = async (req, res) => {
  try {
    const empresaId = req.empresa.id;
    const { dataInicio, dataFim } = req.query;
    
    const analise = await executarAnaliseSemanal(empresaId, dataInicio, dataFim);
    
    res.json({
      success: true,
      analise
    });
  } catch (error) {
    console.error('Erro ao obter análise semanal:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor ao gerar análise',
      message: error.message 
    });
  }
};

module.exports = {
  obterAnaliseSemanal
};

