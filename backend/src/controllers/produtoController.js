const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { verificarEstoqueBaixo } = require('../utils/alertaUtils');

const prisma = new PrismaClient();

// Listar produtos da empresa
const listarProdutos = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      categoria = '', 
      ativo = 'true' 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {
      empresaId: req.empresa.id,
      ativo: ativo === 'true' ? true : ativo === 'false' ? false : undefined
    };

    // Filtro de busca
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { codigo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtro de categoria
    if (categoria) {
      where.categoria = { contains: categoria, mode: 'insensitive' };
    }

    // Buscar produtos
    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        skip,
        take,
        orderBy: { nome: 'asc' }
      }),
      prisma.produto.count({ where })
    ]);

    res.json({
      produtos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar produto por ID
const buscarProduto = async (req, res) => {
  try {
    const { id } = req.params;

    const produto = await prisma.produto.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ produto });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo produto
const criarProduto = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const {
      nome,
      descricao,
      codigo,
      precoVenda,
      precoCusto,
      estoque,
      estoqueMin,
      categoria,
      marca,
      unidade
    } = req.body;

    // Verificar se código já existe
    const codigoExistente = await prisma.produto.findFirst({
      where: {
        codigo,
        empresaId: req.empresa.id
      }
    });

    if (codigoExistente) {
      return res.status(400).json({
        error: 'Já existe um produto com este código'
      });
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        codigo,
        precoVenda: parseFloat(precoVenda),
        precoCusto: parseFloat(precoCusto),
        estoque: parseInt(estoque) || 0,
        estoqueMin: parseInt(estoqueMin) || 5,
        categoria,
        marca,
        unidade: unidade || 'UN',
        empresaId: req.empresa.id
      }
    });

    res.status(201).json({
      message: 'Produto criado com sucesso',
      produto
    });

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar produto
const atualizarProduto = async (req, res) => {
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
      nome,
      descricao,
      codigo,
      precoVenda,
      precoCusto,
      estoque,
      estoqueMin,
      categoria,
      marca,
      unidade,
      ativo
    } = req.body;

    // Verificar se produto existe
    const produtoExistente = await prisma.produto.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!produtoExistente) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Verificar se código já existe em outro produto
    if (codigo && codigo !== produtoExistente.codigo) {
      const codigoExistente = await prisma.produto.findFirst({
        where: {
          codigo,
          empresaId: req.empresa.id,
          id: { not: id }
        }
      });

      if (codigoExistente) {
        return res.status(400).json({
          error: 'Já existe outro produto com este código'
        });
      }
    }

    const produto = await prisma.produto.update({
      where: { id },
      data: {
        nome,
        descricao,
        codigo,
        precoVenda: precoVenda ? parseFloat(precoVenda) : undefined,
        precoCusto: precoCusto ? parseFloat(precoCusto) : undefined,
        estoque: estoque !== undefined ? parseInt(estoque) : undefined,
        estoqueMin: estoqueMin !== undefined ? parseInt(estoqueMin) : undefined,
        categoria,
        marca,
        unidade,
        ativo: ativo !== undefined ? ativo : undefined
      }
    });

    // Verificar alertas de estoque baixo após atualização
    if (estoque !== undefined) {
      await verificarEstoqueBaixo(req.empresa.id);
    }

    res.json({
      message: 'Produto atualizado com sucesso',
      produto
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir produto
const excluirProduto = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se produto existe
    const produto = await prisma.produto.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Verificar se produto tem vendas/compras associadas
    const [vendas, compras] = await Promise.all([
      prisma.itemVenda.findFirst({
        where: { produtoId: id }
      }),
      prisma.itemCompra.findFirst({
        where: { produtoId: id }
      })
    ]);

    if (vendas || compras) {
      // Se tem movimentações, apenas desativar
      await prisma.produto.update({
        where: { id },
        data: { ativo: false }
      });

      return res.json({
        message: 'Produto desativado com sucesso (possui movimentações)'
      });
    }

    // Se não tem movimentações, excluir permanentemente
    await prisma.produto.delete({
      where: { id }
    });

    res.json({
      message: 'Produto excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar produtos com estoque baixo
const produtosEstoqueBaixo = async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        empresaId: req.empresa.id,
        ativo: true,
        estoque: {
          lte: prisma.produto.fields.estoqueMin
        }
      },
      orderBy: { estoque: 'asc' }
    });

    res.json({ produtos });

  } catch (error) {
    console.error('Erro ao buscar produtos com estoque baixo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar estoque de produto
const atualizarEstoque = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade, operacao } = req.body; // operacao: 'entrada' ou 'saida'

    if (!['entrada', 'saida'].includes(operacao)) {
      return res.status(400).json({
        error: 'Operação deve ser "entrada" ou "saida"'
      });
    }

    const produto = await prisma.produto.findFirst({
      where: {
        id,
        empresaId: req.empresa.id
      }
    });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const novaQuantidade = operacao === 'entrada' 
      ? produto.estoque + parseInt(quantidade)
      : produto.estoque - parseInt(quantidade);

    if (novaQuantidade < 0) {
      return res.status(400).json({
        error: 'Estoque insuficiente'
      });
    }

    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: { estoque: novaQuantidade }
    });

    res.json({
      message: 'Estoque atualizado com sucesso',
      produto: produtoAtualizado
    });

  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  listarProdutos,
  buscarProduto,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  produtosEstoqueBaixo,
  atualizarEstoque
};

