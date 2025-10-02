const express = require('express');
const { body, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  listarVendas,
  buscarVenda,
  criarVenda,
  atualizarVenda,
  atualizarStatusVenda,
  cancelarVenda,
  relatorioVendas
} = require('../controllers/vendaController');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Validações para criação de venda
const criarVendaValidation = [
  body('cliente')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Cliente deve ter entre 2 e 100 caracteres'),
  body('itens')
    .isArray({ min: 1 })
    .withMessage('Venda deve ter pelo menos um item'),
  body('itens.*.produtoId')
    .isLength({ min: 1 })
    .withMessage('ID do produto é obrigatório'),
  body('itens.*.quantidade')
    .isInt({ min: 1 })
    .withMessage('Quantidade deve ser um número inteiro positivo'),
  body('desconto')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Desconto deve ser um número não negativo'),
  body('formaPagamento')
    .optional()
    .isIn(['DINHEIRO', 'CARTAO', 'PIX', 'BOLETO'])
    .withMessage('Forma de pagamento inválida'),
  body('observacoes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
];

// Validações para atualização de venda (inclui precoUnitario)
const atualizarVendaValidation = [
  body('cliente')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Cliente deve ter entre 2 e 100 caracteres'),
  body('itens')
    .isArray({ min: 1 })
    .withMessage('Venda deve ter pelo menos um item'),
  body('itens.*.produtoId')
    .isLength({ min: 1 })
    .withMessage('ID do produto é obrigatório'),
  body('itens.*.quantidade')
    .isInt({ min: 1 })
    .withMessage('Quantidade deve ser um número inteiro positivo'),
  body('itens.*.precoUnitario')
    .isFloat({ min: 0 })
    .withMessage('Preço unitário deve ser um número não negativo'),
  body('desconto')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Desconto deve ser um número não negativo'),
  body('formaPagamento')
    .optional()
    .isIn(['DINHEIRO', 'CARTAO', 'PIX', 'BOLETO'])
    .withMessage('Forma de pagamento inválida'),
  body('observacoes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
];

// Validações para atualização de status
const atualizarStatusValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID da venda é obrigatório'),
  body('status')
    .isIn(['PENDENTE', 'CONCLUIDA', 'CANCELADA'])
    .withMessage('Status inválido')
];

// Validação para ID
const idValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID da venda é obrigatório')
];

// Rotas
router.get('/', listarVendas);
router.get('/relatorio', relatorioVendas);
router.get('/:id', idValidation, buscarVenda);
router.post('/', criarVendaValidation, criarVenda);
router.put('/:id', idValidation, atualizarVendaValidation, atualizarVenda);
router.patch('/:id/status', atualizarStatusValidation, atualizarStatusVenda);
router.patch('/:id/cancelar', idValidation, cancelarVenda);

module.exports = router;

