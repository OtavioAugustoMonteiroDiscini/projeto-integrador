const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Listar compras da empresa
const listarCompras = async (req, res) => {
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
      where.dataCompra = {};
      if (dataInicio) {
        where.dataCompra.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataCompra.lte = new Date(dataFim);
      }
    }

    // Buscar compras
    const [compras, total] = await Promise.all([
      prisma.compra.findMany({
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
        orderBy: { dataCompra: 'desc' }
      }),
      prisma.compra.count({ where })
    ]);

    res.json({
      compras,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar compras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar compra por ID
const buscarCompra = async (req, res) => {
  try {
    const { id } = req.params;

    const compra = await prisma.compra.findFirst({
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
                precoCusto: true
              }
            }
          }
        }
      }
    });

    if (!compra) {
      return res.status(404).json({ error: 'Compra não encontrada' });
    }

    res.json({ compra });

  } catch (error) {
    console.error('Erro ao buscar compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova compra
const criarCompra = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const {
      fornecedor,
      itens,
      observacoes
    } = req.body;

    // Validar itens
    if (!itens || itens.length === 0) {
      return res.status(400).json({
        error: 'Compra deve ter pelo menos um item'
      });
    }

    // Verificar se todos os produtos existem
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
    }

    // Gerar número da compra
    const ultimaCompra = await prisma.compra.findFirst({
      where: { empresaId: req.empresa.id },
      orderBy: { numero: 'desc' }
    });

    const proximoNumero = ultimaCompra 
      ? (parseInt(ultimaCompra.numero) + 1).toString().padStart(6, '0')
      : '000001';

    // Calcular valor total
    let valorTotal = 0;
    for (const item of itens) {
      valorTotal += item.precoUnitario * item.quantidade;
    }

    // Criar compra e itens em uma transação
    const compra = await prisma.$transaction(async (tx) => {
      // Criar compra
      const novaCompra = await tx.compra.create({
        data: {
          numero: proximoNumero,
          fornecedor,
          valorTotal,
          observacoes,
          empresaId: req.empresa.id
        }
      });

      // Criar itens e atualizar estoque
      for (const item of itens) {
        const produto = await tx.produto.findUnique({
          where: { id: item.produtoId }
        });

        const subtotal = item.precoUnitario * item.quantidade;

        // Criar item da compra
        await tx.itemCompra.create({
          data: {
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal,
            compraId: novaCompra.id,
            produtoId: item.produtoId
          }
        });

        // Atualizar estoque e preço de custo
        await tx.produto.update({
          where: { id: item.produtoId },
          data: {
            estoque: produto.estoque + item.quantidade,
            precoCusto: item.precoUnitario // Atualizar preço de custo
          }
        });
      }

      return novaCompra;
    });

    // Buscar compra completa para retornar
    const compraCompleta = await prisma.compra.findUnique({
      where: { id: compra.id },
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

    res.status(201).json({
      message: 'Compra criada com sucesso',
      compra: compraCompleta
    });

  } catch (error) {
    console.error('Erro ao criar compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar status da compra
const atualizarStatusCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDENTE', 'CONCLUIDA', 'CANCELADA'].includes(status)) {
      return res.status(400).json({
        error: 'Status inválido'
      });
    }

    const compra = await prisma.compra.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!compra) {
      return res.status(404).json({ error: 'Compra não encontrada' });
    }

    const compraAtualizada = await prisma.compra.update({
      where: { id },
      data: { status }
    });

    res.json({
      message: 'Status da compra atualizado com sucesso',
      compra: compraAtualizada
    });

  } catch (error) {
    console.error('Erro ao atualizar status da compra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Cancelar compra (reverter estoque)
const cancelarCompra = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Cancelando compra - ID recebido:', id);
    console.log('Tipo do ID:', typeof id);
    console.log('Empresa ID:', req.empresa?.id);

    if (!id) {
      console.error('ID não fornecido na requisição');
      return res.status(400).json({ 
        error: 'ID da compra é obrigatório',
        received: { id, type: typeof id }
      });
    }

    const compraId = String(id).trim();

    if (compraId === '') {
      return res.status(400).json({ 
        error: 'ID da compra é obrigatório',
        received: { id, type: typeof id }
      });
    }

    console.log('Buscando compra com ID:', compraId, 'para empresa:', req.empresa.id);

    const compra = await prisma.compra.findFirst({
      where: {
        id: compraId,
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

    if (!compra) {
      return res.status(404).json({ error: 'Compra não encontrada' });
    }

    if (compra.status === 'CANCELADA') {
      return res.status(400).json({
        error: 'Compra já está cancelada'
      });
    }

    // Reverter estoque e cancelar compra em transação
    await prisma.$transaction(async (tx) => {
      // Reverter estoque dos produtos
      for (const item of compra.itens) {
        const novoEstoque = item.produto.estoque - item.quantidade;
        
        if (novoEstoque < 0) {
          throw new Error(`Não é possível cancelar compra. Estoque do produto ${item.produto.nome} ficaria negativo.`);
        }

        await tx.produto.update({
          where: { id: item.produtoId },
          data: {
            estoque: novoEstoque
          }
        });
      }

      // Cancelar compra
      await tx.compra.update({
        where: { id: compraId },
        data: { status: 'CANCELADA' }
      });
    });

    res.json({
      message: 'Compra cancelada com sucesso. Estoque revertido.'
    });

  } catch (error) {
    console.error('Erro ao cancelar compra:', error);
    res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    });
  }
};

// Relatório de compras
const relatorioCompras = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    const where = {
      empresaId: req.empresa.id,
      status: 'CONCLUIDA'
    };

    if (dataInicio || dataFim) {
      where.dataCompra = {};
      if (dataInicio) {
        where.dataCompra.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataCompra.lte = new Date(dataFim);
      }
    }

    const [compras, totalCompras, valorTotal] = await Promise.all([
      prisma.compra.findMany({
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
        orderBy: { dataCompra: 'desc' }
      }),
      prisma.compra.count({ where }),
      prisma.compra.aggregate({
        where,
        _sum: { valorTotal: true }
      })
    ]);

    // Fornecedores mais utilizados
    const fornecedoresMaisUtilizados = await prisma.compra.groupBy({
      by: ['fornecedor'],
      where,
      _sum: { valorTotal: true },
      _count: true,
      orderBy: { _count: { fornecedor: 'desc' } },
      take: 10
    });

    // Produtos mais comprados
    const produtosMaisComprados = await prisma.itemCompra.groupBy({
      by: ['produtoId'],
      where: {
        compra: {
          empresaId: req.empresa.id,
          status: 'CONCLUIDA',
          ...(dataInicio || dataFim ? {
            dataCompra: {
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
      produtosMaisComprados.map(async (item) => {
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
        totalCompras,
        valorTotal: valorTotal._sum.valorTotal || 0
      },
      fornecedoresMaisUtilizados,
      produtosMaisComprados: produtosComNomes,
      compras
    });

  } catch (error) {
    console.error('Erro ao gerar relatório de compras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar compra existente
const atualizarCompra = async (req, res) => {
  try {
    console.log('Iniciando atualização de compra:', req.params.id);
    console.log('Dados recebidos:', req.body);

    const { id } = req.params;
    const {
      fornecedor,
      itens,
      desconto = 0,
      formaPagamento = 'DINHEIRO',
      observacoes,
      status = 'PENDENTE'
    } = req.body;

    // Verificar se a compra existe
    const compraExistente = await prisma.compra.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!compraExistente) {
      return res.status(404).json({ error: 'Compra não encontrada' });
    }

    // Validar itens
    if (!itens || itens.length === 0) {
      return res.status(400).json({
        error: 'Compra deve ter pelo menos um item'
      });
    }

    // Calcular totais
    const subtotal = itens.reduce((total, item) => {
      return total + (parseFloat(item.quantidade) * parseFloat(item.precoUnitario));
    }, 0);

    const valorTotal = subtotal - parseFloat(desconto);

    // Atualizar compra usando transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Remover itens antigos
      await tx.itemCompra.deleteMany({
        where: { compraId: id }
      });

      // Atualizar compra
      const compraAtualizada = await tx.compra.update({
        where: { id },
        data: {
          fornecedor,
          subtotal,
          desconto: parseFloat(desconto),
          valorTotal,
          formaPagamento,
          observacoes,
          status
        }
      });

      // Criar novos itens
      for (const item of itens) {
        await tx.itemCompra.create({
          data: {
            compraId: id,
            produtoId: item.produtoId,
            quantidade: parseInt(item.quantidade),
            precoUnitario: parseFloat(item.precoUnitario),
            subtotal: parseInt(item.quantidade) * parseFloat(item.precoUnitario)
          }
        });
      }

      return compraAtualizada;
    });

    res.json({
      message: 'Compra atualizada com sucesso',
      compra: resultado
    });

  } catch (error) {
    console.error('Erro ao atualizar compra:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

// Excluir compra permanentemente (apenas se estiver cancelada)
const excluirCompra = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Excluindo compra com ID:', id);

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ error: 'ID da compra é obrigatório' });
    }

    const compraId = id.trim();

    // Buscar compra
    const compra = await prisma.compra.findFirst({
      where: {
        id: compraId,
        empresaId: req.empresa.id
      }
    });

    if (!compra) {
      return res.status(404).json({ error: 'Compra não encontrada' });
    }

    // Só permite excluir se estiver cancelada
    if (compra.status !== 'CANCELADA') {
      return res.status(400).json({
        error: 'Apenas compras canceladas podem ser excluídas permanentemente'
      });
    }

    // Excluir compra e itens em transação
    await prisma.$transaction(async (tx) => {
      // Excluir itens da compra
      await tx.itemCompra.deleteMany({
        where: { compraId: compraId }
      });

      // Excluir compra
      await tx.compra.delete({
        where: { id: compraId }
      });
    });

    res.json({
      message: 'Compra excluída permanentemente com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir compra:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  listarCompras,
  buscarCompra,
  criarCompra,
  atualizarCompra,
  atualizarStatusCompra,
  cancelarCompra,
  excluirCompra,
  relatorioCompras
};

