const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Middleware para verificar se é admin
const verificarAdmin = async (req, res, next) => {
  try {
    if (req.empresa.tipo !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    next();
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar todas as empresas
const listarEmpresas = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      ativo = '',
      tipo = 'EMPRESA'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {
      tipo: tipo || 'EMPRESA'
    };

    if (ativo !== '') {
      where.ativo = ativo === 'true';
    }

    // Filtro de busca
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cnpj: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Buscar empresas
    const [empresas, total] = await Promise.all([
      prisma.empresa.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nome: true,
          cnpj: true,
          email: true,
          telefone: true,
          endereco: true,
          numero: true,
          cidade: true,
          estado: true,
          cep: true,
          tipo: true,
          ativo: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              produtos: true,
              vendas: true,
              compras: true,
              contasPagar: true,
              contasReceber: true,
              alertas: true
            }
          }
        }
      }),
      prisma.empresa.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      empresas,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao listar empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar empresa específica
const buscarEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    const empresa = await prisma.empresa.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        cnpj: true,
        email: true,
        telefone: true,
        endereco: true,
        cidade: true,
        estado: true,
        cep: true,
        tipo: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            produtos: true,
            vendas: true,
            compras: true,
            contasPagar: true,
            contasReceber: true,
            alertas: true
          }
        }
      }
    });

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json({ empresa });

  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova empresa
const criarEmpresa = async (req, res) => {
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
      cnpj,
      email,
      telefone,
      endereco,
      numero,
      cidade,
      estado,
      cep,
      senha,
      tipo = 'EMPRESA'
    } = req.body;

    // Verificar se email já existe
    const emailExistente = await prisma.empresa.findUnique({
      where: { email }
    });

    if (emailExistente) {
      return res.status(400).json({
        error: 'Já existe uma empresa com este email'
      });
    }

    // Verificar se CNPJ já existe
    const cnpjExistente = await prisma.empresa.findUnique({
      where: { cnpj }
    });

    if (cnpjExistente) {
      return res.status(400).json({
        error: 'Já existe uma empresa com este CNPJ'
      });
    }

    // Criptografar senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Preparar dados, incluindo apenas campos definidos
    const dadosEmpresa = {
      nome,
      cnpj,
      email,
      telefone: telefone || null,
      endereco: endereco || null,
      numero: numero || null,
      cidade: cidade || null,
      estado: estado || null,
      cep: cep || null,
      senha: senhaHash,
      tipo
    };

    const empresa = await prisma.empresa.create({
      data: dadosEmpresa,
      select: {
        id: true,
        nome: true,
        cnpj: true,
        email: true,
        telefone: true,
        endereco: true,
        numero: true,
        cidade: true,
        estado: true,
        cep: true,
        tipo: true,
        ativo: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Empresa criada com sucesso',
      empresa
    });

  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    
    // Verificar se é erro de campo não encontrado (migration não executada)
    if (error.code === 'P2001' || error.message?.includes('Unknown column') || error.message?.includes('column') && error.message?.includes('does not exist')) {
      return res.status(500).json({ 
        error: 'Erro no banco de dados',
        message: 'A migration do campo "numero" precisa ser executada. Execute: npm run db:migrate no diretório backend'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
    });
  }
};

// Atualizar empresa
const atualizarEmpresa = async (req, res) => {
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
      cnpj,
      email,
      telefone,
      endereco,
      numero,
      cidade,
      estado,
      cep,
      senha,
      tipo,
      ativo
    } = req.body;

    // Verificar se empresa existe
    const empresaExistente = await prisma.empresa.findUnique({
      where: { id }
    });

    if (!empresaExistente) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Verificar se email já existe em outra empresa
    if (email && email !== empresaExistente.email) {
      const emailExistente = await prisma.empresa.findFirst({
        where: {
          email,
          id: { not: id }
        }
      });

      if (emailExistente) {
        return res.status(400).json({
          error: 'Já existe uma empresa com este email'
        });
      }
    }

    // Verificar se CNPJ já existe em outra empresa
    if (cnpj && cnpj !== empresaExistente.cnpj) {
      const cnpjExistente = await prisma.empresa.findFirst({
        where: {
          cnpj,
          id: { not: id }
        }
      });

      if (cnpjExistente) {
        return res.status(400).json({
          error: 'Já existe uma empresa com este CNPJ'
        });
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao = {
      nome,
      cnpj,
      email,
      telefone,
      endereco,
      numero,
      cidade,
      estado,
      cep,
      tipo,
      ativo
    };

    // Criptografar nova senha se fornecida
    if (senha) {
      dadosAtualizacao.senha = await bcrypt.hash(senha, 10);
    }

    const empresa = await prisma.empresa.update({
      where: { id },
      data: dadosAtualizacao,
      select: {
        id: true,
        nome: true,
        cnpj: true,
        email: true,
        telefone: true,
        endereco: true,
        numero: true,
        cidade: true,
        estado: true,
        cep: true,
        tipo: true,
        ativo: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Empresa atualizada com sucesso',
      empresa
    });

  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir empresa
const excluirEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se empresa existe
    const empresa = await prisma.empresa.findUnique({
      where: { id }
    });

    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    // Não permitir excluir o próprio admin
    if (id === req.empresa.id) {
      return res.status(400).json({
        error: 'Não é possível excluir sua própria conta'
      });
    }

    // Excluir empresa (cascade delete irá remover todos os dados relacionados)
    await prisma.empresa.delete({
      where: { id }
    });

    res.json({
      message: 'Empresa excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Estatísticas gerais do sistema
const estatisticasSistema = async (req, res) => {
  try {
    const [
      totalEmpresas,
      empresasAtivas,
      totalProdutos,
      totalVendas,
      totalCompras,
      totalContasPagar,
      totalContasReceber,
      totalAlertas,
      vendasHoje,
      vendasMes
    ] = await Promise.all([
      prisma.empresa.count({ where: { tipo: 'EMPRESA' } }),
      prisma.empresa.count({ where: { tipo: 'EMPRESA', ativo: true } }),
      prisma.produto.count(),
      prisma.venda.count(),
      prisma.compra.count(),
      prisma.contaPagar.count(),
      prisma.contaReceber.count(),
      prisma.alerta.count(),
      prisma.venda.count({
        where: {
          dataVenda: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.venda.count({
        where: {
          dataVenda: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    res.json({
      totalEmpresas,
      empresasAtivas,
      totalProdutos,
      totalVendas,
      totalCompras,
      totalContasPagar,
      totalContasReceber,
      totalAlertas,
      vendasHoje,
      vendasMes
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do sistema:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  verificarAdmin,
  listarEmpresas,
  buscarEmpresa,
  criarEmpresa,
  atualizarEmpresa,
  excluirEmpresa,
  estatisticasSistema
};
