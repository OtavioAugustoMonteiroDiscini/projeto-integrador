const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Listar contas a receber da empresa
const listarContasReceber = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      categoria = '',
      dataInicio = '', 
      dataFim = '' 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {
      empresaId: req.empresa.id
    };

    if (status) {
      where.status = status;
    }

    if (categoria) {
      where.categoria = { contains: categoria, mode: 'insensitive' };
    }

    if (dataInicio || dataFim) {
      where.dataVencimento = {};
      if (dataInicio) {
        where.dataVencimento.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataVencimento.lte = new Date(dataFim);
      }
    }

    // Buscar contas a receber
    const [contas, total] = await Promise.all([
      prisma.contaReceber.findMany({
        where,
        skip,
        take,
        orderBy: { dataVencimento: 'asc' }
      }),
      prisma.contaReceber.count({ where })
    ]);

    res.json({
      contas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar contas a receber:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar conta a receber por ID
const buscarContaReceber = async (req, res) => {
  try {
    const { id } = req.params;

    const conta = await prisma.contaReceber.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    res.json({ conta });

  } catch (error) {
    console.error('Erro ao buscar conta a receber:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova conta a receber
const criarContaReceber = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const {
      descricao,
      valor,
      dataVencimento,
      cliente,
      categoria,
      observacoes
    } = req.body;

    const conta = await prisma.contaReceber.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        dataVencimento: new Date(dataVencimento),
        cliente,
        categoria,
        observacoes,
        empresaId: req.empresa.id
      }
    });

    res.status(201).json({
      message: 'Conta a receber criada com sucesso',
      conta
    });

  } catch (error) {
    console.error('Erro ao criar conta a receber:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar conta a receber
const atualizarContaReceber = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const {
      descricao,
      valor,
      dataVencimento,
      cliente,
      categoria,
      observacoes
    } = req.body;

    const conta = await prisma.contaReceber.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    const contaAtualizada = await prisma.contaReceber.update({
      where: { id },
      data: {
        descricao,
        valor: valor ? parseFloat(valor) : undefined,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : undefined,
        cliente,
        categoria,
        observacoes
      }
    });

    res.json({
      message: 'Conta a receber atualizada com sucesso',
      conta: contaAtualizada
    });

  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Marcar conta como recebida
const marcarComoRecebida = async (req, res) => {
  try {
    const { id } = req.params;
    const { dataRecebimento } = req.body;

    const conta = await prisma.contaReceber.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    const contaAtualizada = await prisma.contaReceber.update({
      where: { id },
      data: {
        status: 'RECEBIDO',
        dataRecebimento: dataRecebimento ? new Date(dataRecebimento) : new Date()
      }
    });

    res.json({
      message: 'Conta marcada como recebida com sucesso',
      conta: contaAtualizada
    });

  } catch (error) {
    console.error('Erro ao marcar conta como recebida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir conta a receber
const excluirContaReceber = async (req, res) => {
  try {
    const { id } = req.params;

    const conta = await prisma.contaReceber.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!conta) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    await prisma.contaReceber.delete({
      where: { id }
    });

    res.json({
      message: 'Conta a receber excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir conta a receber:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Relatório de contas a receber
const relatorioContasReceber = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    const where = {
      empresaId: req.empresa.id
    };

    if (dataInicio || dataFim) {
      where.dataVencimento = {};
      if (dataInicio) {
        where.dataVencimento.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataVencimento.lte = new Date(dataFim);
      }
    }

    const [contas, totalContas, valorTotal] = await Promise.all([
      prisma.contaReceber.findMany({
        where,
        orderBy: { dataVencimento: 'asc' }
      }),
      prisma.contaReceber.count({ where }),
      prisma.contaReceber.aggregate({
        where,
        _sum: { valor: true }
      })
    ]);

    // Estatísticas por status
    const contasPorStatus = await prisma.contaReceber.groupBy({
      by: ['status'],
      where,
      _sum: { valor: true },
      _count: true
    });

    // Estatísticas por categoria
    const contasPorCategoria = await prisma.contaReceber.groupBy({
      by: ['categoria'],
      where,
      _sum: { valor: true },
      _count: true,
      orderBy: { _sum: { valor: 'desc' } }
    });

    // Contas vencidas
    const hoje = new Date();
    const contasVencidas = await prisma.contaReceber.findMany({
      where: {
        ...where,
        dataVencimento: { lt: hoje },
        status: { not: 'RECEBIDO' }
      },
      orderBy: { dataVencimento: 'asc' }
    });

    // Clientes com mais contas a receber
    const clientesMaisContas = await prisma.contaReceber.groupBy({
      by: ['cliente'],
      where: {
        ...where,
        cliente: { not: null }
      },
      _sum: { valor: true },
      _count: true,
      orderBy: { _sum: { valor: 'desc' } },
      take: 10
    });

    res.json({
      periodo: {
        dataInicio,
        dataFim
      },
      resumo: {
        totalContas,
        valorTotal: valorTotal._sum.valor || 0
      },
      contasPorStatus,
      contasPorCategoria,
      contasVencidas,
      clientesMaisContas,
      contas
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de contas a receber:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  listarContasReceber,
  buscarContaReceber,
  criarContaReceber,
  atualizarContaReceber,
  marcarComoRecebida,
  excluirContaReceber,
  relatorioContasReceber
};

