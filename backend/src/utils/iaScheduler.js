const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { executarAnaliseSemanal } = require('../services/iaAnaliseService');

const prisma = new PrismaClient();

/**
 * Executa análise semanal para todas as empresas ativas
 */
const executarAnaliseTodasEmpresas = async () => {
  try {
    console.log('🤖 Iniciando análise semanal de IA para todas as empresas...');
    
    const empresas = await prisma.empresa.findMany({
      where: { ativo: true },
      select: { id: true, nome: true }
    });

    console.log(`📊 Encontradas ${empresas.length} empresas ativas`);

    for (const empresa of empresas) {
      try {
        console.log(`🔍 Analisando empresa: ${empresa.nome} (${empresa.id})`);
        const analise = await executarAnaliseSemanal(empresa.id);
        
        if (analise.analiseProdutoMaisVendido?.recomendacao) {
          console.log(`✅ Análise concluída para ${empresa.nome}`);
          console.log(`   Produto mais vendido: ${analise.analiseProdutoMaisVendido.produto.nome}`);
          console.log(`   Recomendação: ${analise.analiseProdutoMaisVendido.recomendacao.tipo}`);
        } else {
          console.log(`✅ Análise concluída para ${empresa.nome} (sem recomendações)`);
        }
      } catch (error) {
        console.error(`❌ Erro ao analisar empresa ${empresa.nome}:`, error.message);
      }
    }

    console.log('✅ Análise semanal concluída para todas as empresas');
  } catch (error) {
    console.error('❌ Erro ao executar análise semanal:', error);
  }
};

/**
 * Inicia o agendador de análise semanal
 * Executa toda segunda-feira às 8:00 da manhã
 */
const iniciarScheduler = () => {
  // Executar toda segunda-feira às 8:00
  cron.schedule('0 8 * * 1', async () => {
    console.log('⏰ Executando análise semanal agendada...');
    await executarAnaliseTodasEmpresas();
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });

  console.log('📅 Agendador de análise semanal configurado (Segundas-feiras às 8:00)');
};

module.exports = {
  iniciarScheduler,
  executarAnaliseTodasEmpresas
};

