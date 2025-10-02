const express = require('express');
const { body, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  listarCompras,
  buscarCompra,
  criarCompra,
  atualizarStatusCompra,
  cancelarCompra,
  relatorioCompras
} = require('../controllers/compraController');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Validações para criação de compra
const criarCompraValidation = [
  body('fornecedor')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Fornecedor deve ter entre 2 e 100 caracteres'),
  body('itens')
    .isArray({ min: 1 })
    .withMessage('Compra deve ter pelo menos um item'),
  body('itens.*.produtoId')
    .isLength({ min: 1 })
    .withMessage('ID do produto é obrigatório'),
  body('itens.*.quantidade')
    .isInt({ min: 1 })
    .withMessage('Quantidade deve ser um número inteiro positivo'),
  body('itens.*.precoUnitario')
    .isFloat({ min: 0 })
    .withMessage('Preço unitário deve ser um número não negativo'),
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
    .withMessage('ID da compra é obrigatório'),
  body('status')
    .isIn(['PENDENTE', 'CONCLUIDA', 'CANCELADA'])
    .withMessage('Status inválido')
];

// Validação para ID
const idValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID da compra é obrigatório')
];

// Rotas
router.get('/', listarCompras);
router.get('/relatorio', relatorioCompras);
router.get('/:id', idValidation, buscarCompra);
router.post('/', criarCompraValidation, criarCompra);
router.patch('/:id/status', atualizarStatusValidation, atualizarStatusCompra);
router.patch('/:id/cancelar', idValidation, cancelarCompra);

module.exports = router;

