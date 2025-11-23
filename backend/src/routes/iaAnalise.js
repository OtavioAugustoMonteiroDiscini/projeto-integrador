const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { obterAnaliseSemanal } = require('../controllers/iaAnaliseController');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Rota para obter análise semanal de IA
router.get('/semanal', obterAnaliseSemanal);

module.exports = router;

