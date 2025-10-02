const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Listar contas a pagar da empresa
const listarContasPagar = async (req, res) => {
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

    // Buscar contas a pagar
    const [contas, total] = await Promise.all([
      prisma.contaPagar.findMany({
        where,
        skip,
        take,
        orderBy: { dataVencimento: 'asc' }
      }),
      prisma.contaPagar.count({ where })
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
    console.error('Erro ao listar contas a pagar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar conta a pagar por ID
const buscarContaPagar = async (req, res) => {
  try {
    const { id } = req.params;

    const conta = await prisma.contaPagar.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    res.json({ conta });

  } catch (error) {
    console.error('Erro ao buscar conta a pagar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova conta a pagar
const criarContaPagar = async (req, res) => {
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
      categoria,
      observacoes
    } = req.body;

    const conta = await prisma.contaPagar.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        dataVencimento: new Date(dataVencimento),
        categoria,
        observacoes,
        empresaId: req.empresa.id
      }
    });

    res.status(201).json({
      message: 'Conta a pagar criada com sucesso',
      conta
    });

  } catch (error) {
    console.error('Erro ao criar conta a pagar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar conta a pagar
const atualizarContaPagar = async (req, res) => {
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
      categoria,
      observacoes
    } = req.body;

    const conta = await prisma.contaPagar.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    const contaAtualizada = await prisma.contaPagar.update({
      where: { id },
      data: {
        descricao,
        valor: valor ? parseFloat(valor) : undefined,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : undefined,
        categoria,
        observacoes
      }
    });

    res.json({
      message: 'Conta a pagar atualizada com sucesso',
      conta: contaAtualizada
    });

  } catch (error) {
    console.error('Erro ao atualizar conta a pagar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Marcar conta como paga
const marcarComoPaga = async (req, res) => {
  try {
    const { id } = req.params;
    const { dataPagamento } = req.body;

    const conta = await prisma.contaPagar.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    const contaAtualizada = await prisma.contaPagar.update({
      where: { id },
      data: {
        status: 'PAGO',
        dataPagamento: dataPagamento ? new Date(dataPagamento) : new Date()
      }
    });

    res.json({
      message: 'Conta marcada como paga com sucesso',
      conta: contaAtualizada
    });

  } catch (error) {
    console.error('Erro ao marcar conta como paga:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir conta a pagar
const excluirContaPagar = async (req, res) => {
  try {
    const { id } = req.params;

    const conta = await prisma.contaPagar.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!conta) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    await prisma.contaPagar.delete({
      where: { id }
    });

    res.json({
      message: 'Conta a pagar excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir conta a pagar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Relatório de contas a pagar
const relatorioContasPagar = async (req, res) => {
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
      prisma.contaPagar.findMany({
        where,
        orderBy: { dataVencimento: 'asc' }
      }),
      prisma.contaPagar.count({ where }),
      prisma.contaPagar.aggregate({
        where,
        _sum: { valor: true }
      })
    ]);

    // Estatísticas por status
    const contasPorStatus = await prisma.contaPagar.groupBy({
      by: ['status'],
      where,
      _sum: { valor: true },
      _count: true
    });

    // Estatísticas por categoria
    const contasPorCategoria = await prisma.contaPagar.groupBy({
      by: ['categoria'],
      where,
      _sum: { valor: true },
      _count: true,
      orderBy: { _sum: { valor: 'desc' } }
    });

    // Contas vencidas
    const hoje = new Date();
    const contasVencidas = await prisma.contaPagar.findMany({
      where: {
        ...where,
        dataVencimento: { lt: hoje },
        status: { not: 'PAGO' }
      },
      orderBy: { dataVencimento: 'asc' }
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
      contas
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de contas a pagar:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  listarContasPagar,
  buscarContaPagar,
  criarContaPagar,
  atualizarContaPagar,
  marcarComoPaga,
  excluirContaPagar,
  relatorioContasPagar
};

