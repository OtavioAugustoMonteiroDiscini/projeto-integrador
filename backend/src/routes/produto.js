const express = require('express');
const { body, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  listarProdutos,
  buscarProduto,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  produtosEstoqueBaixo,
  atualizarEstoque
} = require('../controllers/produtoController');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Validações para criação de produto
const criarProdutoValidation = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('codigo')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Código é obrigatório e deve ter no máximo 50 caracteres'),
  body('precoVenda')
    .isFloat({ min: 0 })
    .withMessage('Preço de venda deve ser um número positivo'),
  body('precoCusto')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preço de custo deve ser um número positivo'),
  body('estoque')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estoque deve ser um número inteiro não negativo'),
  body('estoqueMin')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estoque mínimo deve ser um número inteiro não negativo'),
  body('categoria')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Categoria deve ter no máximo 50 caracteres'),
  body('marca')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Marca deve ter no máximo 50 caracteres'),
  body('unidade')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Unidade deve ter no máximo 10 caracteres')
];

// Validações para atualização de produto
const atualizarProdutoValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID do produto é obrigatório'),
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('codigo')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Código deve ter no máximo 50 caracteres'),
  body('precoVenda')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preço de venda deve ser um número positivo'),
  body('precoCusto')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preço de custo deve ser um número positivo'),
  body('estoque')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estoque deve ser um número inteiro não negativo'),
  body('estoqueMin')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estoque mínimo deve ser um número inteiro não negativo'),
  body('categoria')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Categoria deve ter no máximo 50 caracteres'),
  body('marca')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Marca deve ter no máximo 50 caracteres'),
  body('unidade')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Unidade deve ter no máximo 10 caracteres'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano')
];

// Validações para atualização de estoque
const atualizarEstoqueValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID do produto é obrigatório'),
  body('quantidade')
    .isInt({ min: 1 })
    .withMessage('Quantidade deve ser um número inteiro positivo'),
  body('operacao')
    .isIn(['entrada', 'saida'])
    .withMessage('Operação deve ser "entrada" ou "saida"')
];

// Validação para ID
const idValidation = [
  param('id')
    .isUUID()
    .withMessage('ID do produto inválido')
];

// Rotas
router.get('/', listarProdutos);
router.get('/estoque-baixo', produtosEstoqueBaixo);
router.get('/:id', idValidation, buscarProduto);
router.post('/', criarProdutoValidation, criarProduto);
router.put('/:id', atualizarProdutoValidation, atualizarProduto);
router.patch('/:id/estoque', atualizarEstoqueValidation, atualizarEstoque);
router.delete('/:id', idValidation, excluirProduto);

module.exports = router;

