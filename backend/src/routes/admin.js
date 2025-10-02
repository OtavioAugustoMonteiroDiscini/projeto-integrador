const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  verificarAdmin,
  listarEmpresas,
  buscarEmpresa,
  criarEmpresa,
  atualizarEmpresa,
  excluirEmpresa,
  estatisticasSistema
} = require('../controllers/adminController');

const router = express.Router();

// Aplicar autenticação e verificação de admin em todas as rotas
router.use(authenticateToken);
router.use(verificarAdmin);

// Validações para criação de empresa
const criarEmpresaValidation = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('cnpj')
    .notEmpty()
    .withMessage('CNPJ é obrigatório')
    .isLength({ min: 14, max: 18 })
    .withMessage('CNPJ deve ter entre 14 e 18 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('telefone')
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage('Telefone deve ter entre 10 e 15 caracteres'),
  body('endereco')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Endereço deve ter no máximo 255 caracteres'),
  body('cidade')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Cidade deve ter no máximo 100 caracteres'),
  body('estado')
    .optional()
    .isLength({ max: 2 })
    .withMessage('Estado deve ter no máximo 2 caracteres'),
  body('cep')
    .optional()
    .isLength({ min: 8, max: 9 })
    .withMessage('CEP deve ter entre 8 e 9 caracteres'),
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('tipo')
    .optional()
    .isIn(['EMPRESA', 'ADMIN'])
    .withMessage('Tipo inválido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser true ou false')
];

// Validações para atualização de empresa
const atualizarEmpresaValidation = [
  body('nome')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Nome deve ter entre 2 e 255 caracteres'),
  body('cnpj')
    .optional()
    .isLength({ min: 14, max: 18 })
    .withMessage('CNPJ deve ter entre 14 e 18 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('telefone')
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage('Telefone deve ter entre 10 e 15 caracteres'),
  body('endereco')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Endereço deve ter no máximo 255 caracteres'),
  body('cidade')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Cidade deve ter no máximo 100 caracteres'),
  body('estado')
    .optional()
    .isLength({ max: 2 })
    .withMessage('Estado deve ter no máximo 2 caracteres'),
  body('cep')
    .optional()
    .isLength({ min: 8, max: 9 })
    .withMessage('CEP deve ter entre 8 e 9 caracteres'),
  body('senha')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('tipo')
    .optional()
    .isIn(['EMPRESA', 'ADMIN'])
    .withMessage('Tipo inválido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser true ou false')
];

const idValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID da empresa é obrigatório')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Busca deve ter no máximo 255 caracteres'),
  query('ativo')
    .optional()
    .isIn(['true', 'false', ''])
    .withMessage('Ativo deve ser true, false ou vazio'),
  query('tipo')
    .optional()
    .isIn(['EMPRESA', 'ADMIN'])
    .withMessage('Tipo inválido')
];

// Rotas
router.get('/estatisticas', estatisticasSistema);
router.get('/empresas', queryValidation, listarEmpresas);
router.get('/empresas/:id', idValidation, buscarEmpresa);
router.post('/empresas', criarEmpresaValidation, criarEmpresa);
router.put('/empresas/:id', idValidation, atualizarEmpresaValidation, atualizarEmpresa);
router.delete('/empresas/:id', idValidation, excluirEmpresa);

module.exports = router;
