const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Função para gerar token JWT
const generateToken = (empresaId) => {
  return jwt.sign(
    { empresaId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Registrar nova empresa
const register = async (req, res) => {
  try {
    // Verificar erros de validação
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
      cidade,
      estado,
      cep,
      senha
    } = req.body;

    // Verificar se empresa já existe
    const empresaExistente = await prisma.empresa.findFirst({
      where: {
        OR: [
          { email },
          { cnpj }
        ]
      }
    });

    if (empresaExistente) {
      return res.status(400).json({
        error: 'Empresa já cadastrada com este email ou CNPJ'
      });
    }

    // Criptografar senha
    const saltRounds = 12;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // Criar empresa
    const novaEmpresa = await prisma.empresa.create({
      data: {
        nome,
        cnpj,
        email,
        telefone,
        endereco,
        cidade,
        estado,
        cep,
        senha: senhaHash
      },
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
        createdAt: true
      }
    });

    // Gerar token
    const token = generateToken(novaEmpresa.id);

    res.status(201).json({
      message: 'Empresa cadastrada com sucesso',
      empresa: novaEmpresa,
      token
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Login da empresa
const login = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { email, senha } = req.body;

    // Buscar empresa
    const empresa = await prisma.empresa.findUnique({
      where: { email }
    });

    if (!empresa) {
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    if (!empresa.ativo) {
      return res.status(401).json({
        error: 'Conta desativada. Entre em contato com o suporte.'
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, empresa.senha);

    if (!senhaValida) {
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    // Gerar token
    const token = generateToken(empresa.id);

    // Retornar dados da empresa (sem senha)
    const { senha: _, ...empresaSemSenha } = empresa;

    res.json({
      message: 'Login realizado com sucesso',
      empresa: empresaSemSenha,
      token
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Obter perfil da empresa logada
const getProfile = async (req, res) => {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: req.empresa.id },
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
        updatedAt: true
      }
    });

    if (!empresa) {
      return res.status(404).json({
        error: 'Empresa não encontrada'
      });
    }

    res.json({ empresa });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Atualizar perfil da empresa
const updateProfile = async (req, res) => {
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
      telefone,
      endereco,
      cidade,
      estado,
      cep
    } = req.body;

    const empresaAtualizada = await prisma.empresa.update({
      where: { id: req.empresa.id },
      data: {
        nome,
        telefone,
        endereco,
        cidade,
        estado,
        cep
      },
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
        updatedAt: true
      }
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      empresa: empresaAtualizada
    });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Alterar senha
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { senhaAtual, novaSenha } = req.body;

    // Buscar empresa com senha
    const empresa = await prisma.empresa.findUnique({
      where: { id: req.empresa.id }
    });

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, empresa.senha);

    if (!senhaValida) {
      return res.status(400).json({
        error: 'Senha atual incorreta'
      });
    }

    // Criptografar nova senha
    const saltRounds = 12;
    const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

    // Atualizar senha
    await prisma.empresa.update({
      where: { id: req.empresa.id },
      data: { senha: novaSenhaHash }
    });

    res.json({
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};

