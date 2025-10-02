const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Função para criar alertas automáticos
const criarAlertaAutomatico = async (empresaId, tipo, titulo, mensagem, prioridade = 'MEDIA') => {
  try {
    // Verificar se já existe um alerta similar recente (últimas 24 horas)
    const alertaExistente = await prisma.alerta.findFirst({
      where: {
        empresaId,
        tipo,
        titulo,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }
    });

    if (!alertaExistente) {
      const alerta = await prisma.alerta.create({
        data: {
          tipo,
          titulo,
          mensagem,
          prioridade,
          empresaId
        }
      });
      console.log(`Alerta criado: ${titulo} para empresa ${empresaId}`);
      return alerta;
    }
    return null;
  } catch (error) {
    console.error('Erro ao criar alerta automático:', error);
    return null;
  }
};

// Verificar e criar alertas de estoque baixo
const verificarEstoqueBaixo = async (empresaId) => {
  try {
    const produtosEstoqueBaixo = await prisma.produto.findMany({
      where: {
        empresaId,
        ativo: true,
        estoque: { lte: 5 } // Considerando estoque <= 5 como baixo
      }
    });

    for (const produto of produtosEstoqueBaixo) {
      await criarAlertaAutomatico(
        empresaId,
        'ESTOQUE_BAIXO',
        `Estoque baixo: ${produto.nome}`,
        `O produto "${produto.nome}" está com estoque baixo (${produto.estoque} unidades). Estoque mínimo: ${produto.estoqueMin} unidades.`,
        'ALTA'
      );
    }
  } catch (error) {
    console.error('Erro ao verificar estoque baixo:', error);
  }
};

// Verificar e criar alertas de vencimento
const verificarVencimentos = async (empresaId) => {
  try {
    const hoje = new Date();
    const proximosDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    // Verificar contas a pagar vencendo
    const contasPagarVencendo = await prisma.contaPagar.findMany({
      where: {
        empresaId,
        status: 'PENDENTE',
        dataVencimento: {
          gte: hoje,
          lte: proximosDias
        }
      }
    });

    for (const conta of contasPagarVencendo) {
      const diasParaVencimento = Math.ceil((conta.dataVencimento - hoje) / (1000 * 60 * 60 * 24));
      
      await criarAlertaAutomatico(
        empresaId,
        'VENCIMENTO',
        `Conta a pagar vencendo: ${conta.descricao}`,
        `A conta "${conta.descricao}" vence em ${diasParaVencimento} dia(s). Valor: R$ ${conta.valor.toFixed(2)}`,
        diasParaVencimento <= 1 ? 'ALTA' : 'MEDIA'
      );
    }

    // Verificar contas a receber vencendo
    const contasReceberVencendo = await prisma.contaReceber.findMany({
      where: {
        empresaId,
        status: 'PENDENTE',
        dataVencimento: {
          gte: hoje,
          lte: proximosDias
        }
      }
    });

    for (const conta of contasReceberVencendo) {
      const diasParaVencimento = Math.ceil((conta.dataVencimento - hoje) / (1000 * 60 * 60 * 24));
      
      await criarAlertaAutomatico(
        empresaId,
        'VENCIMENTO',
        `Conta a receber vencendo: ${conta.descricao}`,
        `A conta "${conta.descricao}" vence em ${diasParaVencimento} dia(s). Valor: R$ ${conta.valor.toFixed(2)}`,
        diasParaVencimento <= 1 ? 'ALTA' : 'MEDIA'
      );
    }
  } catch (error) {
    console.error('Erro ao verificar vencimentos:', error);
  }
};

// Verificar alertas para uma empresa específica
const verificarAlertasEmpresa = async (empresaId) => {
  try {
    await verificarEstoqueBaixo(empresaId);
    await verificarVencimentos(empresaId);
  } catch (error) {
    console.error('Erro ao verificar alertas da empresa:', error);
  }
};

// Verificar alertas para todas as empresas
const verificarAlertasTodasEmpresas = async () => {
  try {
    const empresas = await prisma.empresa.findMany({
      where: { ativo: true },
      select: { id: true }
    });

    for (const empresa of empresas) {
      await verificarAlertasEmpresa(empresa.id);
    }
  } catch (error) {
    console.error('Erro ao verificar alertas de todas as empresas:', error);
  }
};

module.exports = {
  criarAlertaAutomatico,
  verificarEstoqueBaixo,
  verificarVencimentos,
  verificarAlertasEmpresa,
  verificarAlertasTodasEmpresas
};
