const express = require('express');
const { body, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  listarContasReceber,
  buscarContaReceber,
  criarContaReceber,
  atualizarContaReceber,
  marcarComoRecebida,
  excluirContaReceber,
  relatorioContasReceber
} = require('../controllers/contaReceberController');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Validações para criação de conta a receber
const criarContaReceberValidation = [
  body('descricao')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Descrição deve ter entre 2 e 200 caracteres'),
  body('valor')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser um número positivo'),
  body('dataVencimento')
    .isISO8601()
    .withMessage('Data de vencimento inválida'),
  body('cliente')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Cliente deve ter no máximo 100 caracteres'),
  body('categoria')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Categoria deve ter no máximo 50 caracteres'),
  body('observacoes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
];

// Validações para atualização de conta a receber
const atualizarContaReceberValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID da conta é obrigatório'),
  body('descricao')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Descrição deve ter entre 2 e 200 caracteres'),
  body('valor')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser um número positivo'),
  body('dataVencimento')
    .optional()
    .isISO8601()
    .withMessage('Data de vencimento inválida'),
  body('cliente')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Cliente deve ter no máximo 100 caracteres'),
  body('categoria')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Categoria deve ter no máximo 50 caracteres'),
  body('observacoes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
];

// Validação para marcar como recebida
const marcarComoRecebidaValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID da conta é obrigatório'),
  body('dataRecebimento')
    .optional()
    .isISO8601()
    .withMessage('Data de recebimento inválida')
];

// Validação para ID
const idValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID da conta é obrigatório')
];

// Rotas
router.get('/', listarContasReceber);
router.get('/relatorio', relatorioContasReceber);
router.get('/:id', idValidation, buscarContaReceber);
router.post('/', criarContaReceberValidation, criarContaReceber);
router.put('/:id', atualizarContaReceberValidation, atualizarContaReceber);
router.patch('/:id/receber', marcarComoRecebidaValidation, marcarComoRecebida);
router.delete('/:id', idValidation, excluirContaReceber);

module.exports = router;

