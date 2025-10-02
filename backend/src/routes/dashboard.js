const express = require('express');
const { query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  dashboardPrincipal,
  vendasPorPeriodo,
  produtosMaisVendidos,
  vendasPorFormaPagamento,
  fluxoCaixa,
  estatisticasEstoque,
  comparativoMensal,
  vendasVsCompras,
  contasPagarVsReceber
} = require('../controllers/dashboardController');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Validações para parâmetros de query
const queryValidation = [
  query('meses')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Meses deve ser um número entre 1 e 24'),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limite deve ser um número entre 1 e 50'),
  query('dataInicio')
    .optional()
    .isISO8601()
    .withMessage('Data de início inválida'),
  query('dataFim')
    .optional()
    .isISO8601()
    .withMessage('Data de fim inválida')
];

// Rotas do dashboard
router.get('/', dashboardPrincipal);
router.get('/vendas-periodo', queryValidation, vendasPorPeriodo);
router.get('/produtos-mais-vendidos', queryValidation, produtosMaisVendidos);
router.get('/vendas-forma-pagamento', queryValidation, vendasPorFormaPagamento);
router.get('/fluxo-caixa', queryValidation, fluxoCaixa);
router.get('/estoque', estatisticasEstoque);
router.get('/comparativo-mensal', queryValidation, comparativoMensal);
router.get('/vendas-vs-compras', queryValidation, vendasVsCompras);
router.get('/contas-pagar-vs-receber', queryValidation, contasPagarVsReceber);

module.exports = router;

