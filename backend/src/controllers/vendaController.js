const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { verificarEstoqueBaixo } = require('../utils/alertaUtils');

const prisma = new PrismaClient();

// Listar vendas da empresa
const listarVendas = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
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

    if (dataInicio || dataFim) {
      where.dataVenda = {};
      if (dataInicio) {
        where.dataVenda.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataVenda.lte = new Date(dataFim);
      }
    }

    // Buscar vendas
    const [vendas, total] = await Promise.all([
      prisma.venda.findMany({
        where,
        skip,
        take,
        include: {
          itens: {
            include: {
              produto: {
                select: {
                  nome: true,
                  codigo: true
                }
              }
            }
          }
        },
        orderBy: { dataVenda: 'desc' }
      }),
      prisma.venda.count({ where })
    ]);

    res.json({
      vendas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar venda por ID
const buscarVenda = async (req, res) => {
  try {
    const { id } = req.params;

    const venda = await prisma.venda.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                codigo: true,
                precoVenda: true
              }
            }
          }
        }
      }
    });

    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    res.json({ venda });

  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova venda
const criarVenda = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const {
      cliente,
      itens,
      desconto = 0,
      formaPagamento = 'DINHEIRO',
      observacoes
    } = req.body;

    // Validar itens
    if (!itens || itens.length === 0) {
      return res.status(400).json({
        error: 'Venda deve ter pelo menos um item'
      });
    }

    // Verificar se todos os produtos existem e têm estoque suficiente
    for (const item of itens) {
      const produto = await prisma.produto.findFirst({
        where: {
          id: item.produtoId,
          empresaId: req.empresa.id,
          ativo: true
        }
      });

      if (!produto) {
        return res.status(400).json({
          error: `Produto não encontrado: ${item.produtoId}`
        });
      }

      if (produto.estoque < item.quantidade) {
        return res.status(400).json({
          error: `Estoque insuficiente para o produto ${produto.nome}. Disponível: ${produto.estoque}`
        });
      }
    }

    // Gerar número da venda
    const ultimaVenda = await prisma.venda.findFirst({
      where: { empresaId: req.empresa.id },
      orderBy: { numero: 'desc' }
    });

    const proximoNumero = ultimaVenda 
      ? (parseInt(ultimaVenda.numero) + 1).toString().padStart(6, '0')
      : '000001';

    // Calcular valor total
    let valorTotal = 0;
    for (const item of itens) {
      const produto = await prisma.produto.findUnique({
        where: { id: item.produtoId }
      });
      valorTotal += produto.precoVenda * item.quantidade;
    }

    valorTotal -= parseFloat(desconto);

    // Criar venda e itens em uma transação
    const venda = await prisma.$transaction(async (tx) => {
      // Criar venda
      const novaVenda = await tx.venda.create({
        data: {
          numero: proximoNumero,
          cliente,
          valorTotal,
          desconto: parseFloat(desconto),
          formaPagamento,
          observacoes,
          empresaId: req.empresa.id
        }
      });

      // Criar itens e atualizar estoque
      for (const item of itens) {
        const produto = await tx.produto.findUnique({
          where: { id: item.produtoId }
        });

        const subtotal = produto.precoVenda * item.quantidade;

        // Criar item da venda
        await tx.itemVenda.create({
          data: {
            quantidade: item.quantidade,
            precoUnitario: produto.precoVenda,
            subtotal,
            vendaId: novaVenda.id,
            produtoId: item.produtoId
          }
        });

        // Atualizar estoque
        await tx.produto.update({
          where: { id: item.produtoId },
          data: {
            estoque: produto.estoque - item.quantidade
          }
        });
      }

      return novaVenda;
    });

    // Buscar venda completa para retornar
    const vendaCompleta = await prisma.venda.findUnique({
      where: { id: venda.id },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                nome: true,
                codigo: true
              }
            }
          }
        }
      }
    });

    // Verificar alertas de estoque baixo após criar venda
    await verificarEstoqueBaixo(req.empresa.id);

    res.status(201).json({
      message: 'Venda criada com sucesso',
      venda: vendaCompleta
    });

  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar status da venda
const atualizarStatusVenda = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDENTE', 'CONCLUIDA', 'CANCELADA'].includes(status)) {
      return res.status(400).json({
        error: 'Status inválido'
      });
    }

    const venda = await prisma.venda.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    const vendaAtualizada = await prisma.venda.update({
      where: { id },
      data: { status }
    });

    // Verificar alertas de estoque baixo quando venda for concluída
    if (status === 'CONCLUIDA') {
      await verificarEstoqueBaixo(req.empresa.id);
    }

    res.json({
      message: 'Status da venda atualizado com sucesso',
      venda: vendaAtualizada
    });

  } catch (error) {
    console.error('Erro ao atualizar status da venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Cancelar venda (reverter estoque)
const cancelarVenda = async (req, res) => {
  try {
    const { id } = req.params;

    const venda = await prisma.venda.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      },
      include: {
        itens: {
          include: {
            produto: true
          }
        }
      }
    });

    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    if (venda.status === 'CANCELADA') {
      return res.status(400).json({
        error: 'Venda já está cancelada'
      });
    }

    // Reverter estoque e cancelar venda em transação
    await prisma.$transaction(async (tx) => {
      // Reverter estoque dos produtos
      for (const item of venda.itens) {
        await tx.produto.update({
          where: { id: item.produtoId },
          data: {
            estoque: item.produto.estoque + item.quantidade
          }
        });
      }

      // Cancelar venda
      await tx.venda.update({
        where: { id },
        data: { status: 'CANCELADA' }
      });
    });

    res.json({
      message: 'Venda cancelada com sucesso. Estoque revertido.'
    });

  } catch (error) {
    console.error('Erro ao cancelar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Relatório de vendas
const relatorioVendas = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    const where = {
      empresaId: req.empresa.id,
      status: 'CONCLUIDA'
    };

    if (dataInicio || dataFim) {
      where.dataVenda = {};
      if (dataInicio) {
        where.dataVenda.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataVenda.lte = new Date(dataFim);
      }
    }

    const [vendas, totalVendas, valorTotal] = await Promise.all([
      prisma.venda.findMany({
        where,
        include: {
          itens: {
            include: {
              produto: {
                select: {
                  nome: true,
                  categoria: true
                }
              }
            }
          }
        },
        orderBy: { dataVenda: 'desc' }
      }),
      prisma.venda.count({ where }),
      prisma.venda.aggregate({
        where,
        _sum: { valorTotal: true }
      })
    ]);

    // Estatísticas por forma de pagamento
    const vendasPorPagamento = await prisma.venda.groupBy({
      by: ['formaPagamento'],
      where,
      _sum: { valorTotal: true },
      _count: true
    });

    // Produtos mais vendidos
    const produtosMaisVendidos = await prisma.itemVenda.groupBy({
      by: ['produtoId'],
      where: {
        venda: {
          empresaId: req.empresa.id,
          status: 'CONCLUIDA',
          ...(dataInicio || dataFim ? {
            dataVenda: {
              ...(dataInicio && { gte: new Date(dataInicio) }),
              ...(dataFim && { lte: new Date(dataFim) })
            }
          } : {})
        }
      },
      _sum: { quantidade: true },
      _count: true,
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 10
    });

    // Buscar nomes dos produtos
    const produtosComNomes = await Promise.all(
      produtosMaisVendidos.map(async (item) => {
        const produto = await prisma.produto.findUnique({
          where: { id: item.produtoId },
          select: { nome: true, codigo: true }
        });
        return {
          ...item,
          produto
        };
      })
    );

    res.json({
      periodo: {
        dataInicio,
        dataFim
      },
      resumo: {
        totalVendas,
        valorTotal: valorTotal._sum.valorTotal || 0
      },
      vendasPorPagamento,
      produtosMaisVendidos: produtosComNomes,
      vendas
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar venda existente
const atualizarVenda = async (req, res) => {
  try {
    console.log('Iniciando atualização de venda:', req.params.id);
    console.log('Dados recebidos:', req.body);

    const { id } = req.params;
    const {
      cliente,
      itens,
      desconto = 0,
      formaPagamento = 'DINHEIRO',
      observacoes,
      status = 'PENDENTE'
    } = req.body;

    // Verificar se a venda existe
    const vendaExistente = await prisma.venda.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!vendaExistente) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    // Validar itens
    if (!itens || itens.length === 0) {
      return res.status(400).json({
        error: 'Venda deve ter pelo menos um item'
      });
    }

    // Calcular totais
    const subtotal = itens.reduce((total, item) => {
      return total + (parseFloat(item.quantidade) * parseFloat(item.precoUnitario));
    }, 0);

    const valorTotal = subtotal - parseFloat(desconto);

    // Atualizar venda usando transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Remover itens antigos
      await tx.itemVenda.deleteMany({
        where: { vendaId: id }
      });

      // Atualizar venda
      const vendaAtualizada = await tx.venda.update({
        where: { id },
        data: {
          cliente,
          desconto: parseFloat(desconto),
          valorTotal,
          formaPagamento,
          observacoes,
          status
        }
      });

      // Criar novos itens
      for (const item of itens) {
        await tx.itemVenda.create({
          data: {
            vendaId: id,
            produtoId: item.produtoId,
            quantidade: parseInt(item.quantidade),
            precoUnitario: parseFloat(item.precoUnitario),
            subtotal: parseInt(item.quantidade) * parseFloat(item.precoUnitario)
          }
        });
      }

      return vendaAtualizada;
    });

    res.json({
      message: 'Venda atualizada com sucesso',
      venda: resultado
    });

  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

module.exports = {
  listarVendas,
  buscarVenda,
  criarVenda,
  atualizarVenda,
  atualizarStatusVenda,
  cancelarVenda,
  relatorioVendas
};

