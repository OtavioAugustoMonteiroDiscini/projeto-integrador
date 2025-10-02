const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso necessário' 
      });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar empresa no banco
    const empresa = await prisma.empresa.findUnique({
      where: { id: decoded.empresaId },
      select: {
        id: true,
        nome: true,
        email: true,
        cnpj: true,
        tipo: true,
        ativo: true
      }
    });

    if (!empresa) {
      return res.status(401).json({ 
        error: 'Empresa não encontrada' 
      });
    }

    if (!empresa.ativo) {
      return res.status(401).json({ 
        error: 'Conta desativada' 
      });
    }

    // Adicionar dados da empresa ao request
    req.empresa = empresa;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado' 
      });
    }

    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.empresa && req.empresa.tipo === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ 
      error: 'Acesso negado. Privilégios de administrador necessários.' 
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin
};

