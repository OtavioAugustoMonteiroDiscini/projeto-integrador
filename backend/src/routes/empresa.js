const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Rota para obter dados da empresa (já implementada no auth)
router.get('/dados', (req, res) => {
  res.json({ empresa: req.empresa });
});

module.exports = router;

