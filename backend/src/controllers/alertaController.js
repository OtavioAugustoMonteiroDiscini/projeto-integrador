const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Listar alertas da empresa
const listarAlertas = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tipo = '', 
      lido = '',
      prioridade = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {
      empresaId: req.empresa.id
    };

    if (tipo) {
      where.tipo = tipo;
    }

    if (lido !== '') {
      where.lido = lido === 'true';
    }

    if (prioridade) {
      where.prioridade = prioridade;
    }

    // Buscar alertas
    const [alertas, total] = await Promise.all([
      prisma.alerta.findMany({
        where,
        skip,
        take,
        orderBy: [
          { prioridade: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.alerta.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      alertas,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao listar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar alerta específico
const buscarAlerta = async (req, res) => {
  try {
    const { id } = req.params;

    const alerta = await prisma.alerta.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!alerta) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    res.json({ alerta });

  } catch (error) {
    console.error('Erro ao buscar alerta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo alerta
const criarAlerta = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const {
      tipo,
      titulo,
      mensagem,
      prioridade = 'MEDIA'
    } = req.body;

    const alerta = await prisma.alerta.create({
      data: {
        tipo,
        titulo,
        mensagem,
        prioridade,
        empresaId: req.empresa.id
      }
    });

    res.status(201).json({
      message: 'Alerta criado com sucesso',
      alerta
    });

  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Marcar alerta como lido
const marcarComoLido = async (req, res) => {
  try {
    const { id } = req.params;

    const alerta = await prisma.alerta.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!alerta) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    const alertaAtualizado = await prisma.alerta.update({
      where: { id },
      data: { lido: true }
    });

    res.json({
      message: 'Alerta marcado como lido',
      alerta: alertaAtualizado
    });

  } catch (error) {
    console.error('Erro ao marcar alerta como lido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Marcar todos os alertas como lidos
const marcarTodosComoLidos = async (req, res) => {
  try {
    await prisma.alerta.updateMany({
      where: {
        empresaId: req.empresa.id,
        lido: false
      },
      data: { lido: true }
    });

    res.json({
      message: 'Todos os alertas foram marcados como lidos'
    });

  } catch (error) {
    console.error('Erro ao marcar todos os alertas como lidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir alerta
const excluirAlerta = async (req, res) => {
  try {
    const { id } = req.params;

    const alerta = await prisma.alerta.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!alerta) {
      return res.status(404).json({ error: 'Alerta não encontrado' });
    }

    await prisma.alerta.delete({
      where: { id }
    });

    res.json({
      message: 'Alerta excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir alerta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir todos os alertas lidos
const excluirAlertasLidos = async (req, res) => {
  try {
    const result = await prisma.alerta.deleteMany({
      where: {
        empresaId: req.empresa.id,
        lido: true
      }
    });

    res.json({
      message: `${result.count} alertas lidos foram excluídos`
    });

  } catch (error) {
    console.error('Erro ao excluir alertas lidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Estatísticas de alertas
const estatisticasAlertas = async (req, res) => {
  try {
    const [
      totalAlertas,
      alertasNaoLidos,
      alertasPorTipo,
      alertasPorPrioridade
    ] = await Promise.all([
      prisma.alerta.count({
        where: { empresaId: req.empresa.id }
      }),
      prisma.alerta.count({
        where: { 
          empresaId: req.empresa.id,
          lido: false 
        }
      }),
      prisma.alerta.groupBy({
        by: ['tipo'],
        where: { empresaId: req.empresa.id },
        _count: { tipo: true }
      }),
      prisma.alerta.groupBy({
        by: ['prioridade'],
        where: { empresaId: req.empresa.id },
        _count: { prioridade: true }
      })
    ]);

    res.json({
      totalAlertas,
      alertasNaoLidos,
      alertasPorTipo: alertasPorTipo.map(item => ({
        tipo: item.tipo,
        quantidade: item._count.tipo
      })),
      alertasPorPrioridade: alertasPorPrioridade.map(item => ({
        prioridade: item.prioridade,
        quantidade: item._count.prioridade
      }))
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função para criar alertas automáticos
const criarAlertaAutomatico = async (empresaId, tipo, titulo, mensagem, prioridade = 'MEDIA') => {
  try {
    const alerta = await prisma.alerta.create({
      data: {
        tipo,
        titulo,
        mensagem,
        prioridade,
        empresaId
      }
    });
    return alerta;
  } catch (error) {
    console.error('Erro ao criar alerta automático:', error);
    return null;
  }
};

// Função para verificar e criar alertas de estoque baixo
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
      // Verificar se já existe um alerta recente para este produto
      const alertaExistente = await prisma.alerta.findFirst({
        where: {
          empresaId,
          tipo: 'ESTOQUE_BAIXO',
          titulo: { contains: produto.nome },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
          }
        }
      });

      if (!alertaExistente) {
        await criarAlertaAutomatico(
          empresaId,
          'ESTOQUE_BAIXO',
          `Estoque baixo: ${produto.nome}`,
          `O produto "${produto.nome}" está com estoque baixo (${produto.estoque} unidades). Estoque mínimo: ${produto.estoqueMin} unidades.`,
          'ALTA'
        );
      }
    }
  } catch (error) {
    console.error('Erro ao verificar estoque baixo:', error);
  }
};

// Função para verificar e criar alertas de vencimento
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

// Verificar alertas da empresa
const verificarAlertas = async (req, res) => {
  try {
    // Primeiro, marcar todos os alertas existentes como lidos
    const alertasMarcados = await prisma.alerta.updateMany({
      where: {
        empresaId: req.empresa.id,
        lido: false
      },
      data: { lido: true }
    });

    // Depois, verificar e criar novos alertas
    await verificarEstoqueBaixo(req.empresa.id);
    await verificarVencimentos(req.empresa.id);

    res.json({
      message: 'Verificação de alertas concluída',
      alertasMarcadosComoLidos: alertasMarcados.count
    });
  } catch (error) {
    console.error('Erro ao verificar alertas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  listarAlertas,
  buscarAlerta,
  criarAlerta,
  marcarComoLido,
  marcarTodosComoLidos,
  excluirAlerta,
  excluirAlertasLidos,
  estatisticasAlertas,
  criarAlertaAutomatico,
  verificarEstoqueBaixo,
  verificarVencimentos,
  verificarAlertas
};