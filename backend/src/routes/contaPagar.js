const express = require('express');
const { body, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  listarContasPagar,
  buscarContaPagar,
  criarContaPagar,
  atualizarContaPagar,
  marcarComoPaga,
  excluirContaPagar,
  relatorioContasPagar
} = require('../controllers/contaPagarController');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Validações para criação de conta a pagar
const criarContaPagarValidation = [
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

// Validações para atualização de conta a pagar
const atualizarContaPagarValidation = [
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

// Validação para marcar como paga
const marcarComoPagaValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID da conta é obrigatório'),
  body('dataPagamento')
    .optional()
    .isISO8601()
    .withMessage('Data de pagamento inválida')
];

// Validação para ID
const idValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID da conta é obrigatório')
];

// Rotas
router.get('/', listarContasPagar);
router.get('/relatorio', relatorioContasPagar);
router.get('/:id', idValidation, buscarContaPagar);
router.post('/', criarContaPagarValidation, criarContaPagar);
router.put('/:id', atualizarContaPagarValidation, atualizarContaPagar);
router.patch('/:id/pagar', marcarComoPagaValidation, marcarComoPaga);
router.delete('/:id', idValidation, excluirContaPagar);

module.exports = router;

