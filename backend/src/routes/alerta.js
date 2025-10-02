const express = require('express');
const { param, body, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  listarAlertas,
  buscarAlerta,
  criarAlerta,
  marcarComoLido,
  marcarTodosComoLidos,
  excluirAlerta,
  excluirAlertasLidos,
  estatisticasAlertas,
  verificarAlertas
} = require('../controllers/alertaController');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Validações
const idValidation = [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID do alerta é obrigatório')
];

const criarAlertaValidation = [
  body('tipo')
    .notEmpty()
    .withMessage('Tipo do alerta é obrigatório')
    .isIn(['ESTOQUE_BAIXO', 'VENCIMENTO', 'OUTROS'])
    .withMessage('Tipo inválido'),
  body('titulo')
    .notEmpty()
    .withMessage('Título é obrigatório')
    .isLength({ min: 1, max: 255 })
    .withMessage('Título deve ter entre 1 e 255 caracteres'),
  body('mensagem')
    .notEmpty()
    .withMessage('Mensagem é obrigatória')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Mensagem deve ter entre 1 e 1000 caracteres'),
  body('prioridade')
    .optional()
    .isIn(['BAIXA', 'MEDIA', 'ALTA'])
    .withMessage('Prioridade inválida')
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
  query('tipo')
    .optional()
    .isIn(['ESTOQUE_BAIXO', 'VENCIMENTO', 'OUTROS'])
    .withMessage('Tipo inválido'),
  query('lido')
    .optional()
    .isBoolean()
    .withMessage('Lido deve ser true ou false'),
  query('prioridade')
    .optional()
    .isIn(['BAIXA', 'MEDIA', 'ALTA'])
    .withMessage('Prioridade inválida')
];

// Rotas
router.get('/', queryValidation, listarAlertas);
router.get('/estatisticas', estatisticasAlertas);
router.get('/verificar', verificarAlertas);
router.get('/:id', idValidation, buscarAlerta);
router.post('/', criarAlertaValidation, criarAlerta);
router.patch('/:id/lido', idValidation, marcarComoLido);
router.patch('/marcar-todos-lidos', marcarTodosComoLidos);
router.delete('/:id', idValidation, excluirAlerta);
router.delete('/lidos', excluirAlertasLidos);

module.exports = router;

