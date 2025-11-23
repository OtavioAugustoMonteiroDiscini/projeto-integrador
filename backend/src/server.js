const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { iniciarScheduler } = require('./utils/iaScheduler');

// Importar rotas
const authRoutes = require('./routes/auth');
const empresaRoutes = require('./routes/empresa');
const produtoRoutes = require('./routes/produto');
const vendaRoutes = require('./routes/venda');
const compraRoutes = require('./routes/compra');
const contaPagarRoutes = require('./routes/contaPagar');
const contaReceberRoutes = require('./routes/contaReceber');
const dashboardRoutes = require('./routes/dashboard');
const alertaRoutes = require('./routes/alerta');
const adminRoutes = require('./routes/admin');
const iaAnaliseRoutes = require('./routes/iaAnalise');

const app = express();
const prisma = new PrismaClient();

// Configurar trust proxy para rate limiting funcionar corretamente
app.set('trust proxy', 1);

// Middleware de segurança
app.use(helmet());

// Rate limiting - mais permissivo em desenvolvimento
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // mais permissivo em dev
  message: 'Muitas tentativas de acesso. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pular rate limiting para health check
    return req.path === '/api/health';
  }
});
app.use(limiter);

// CORS - configuração melhorada
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seudominio.com'] 
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page']
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para servir arquivos estáticos
app.use('/uploads', express.static('uploads'));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/empresa', empresaRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/contas-pagar', contaPagarRoutes);
app.use('/api/contas-receber', contaReceberRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ia-analise', iaAnaliseRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Função para inicializar o servidor
async function startServer() {
  try {
    // Conectar ao banco de dados
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      
      // Iniciar agendador de análise semanal
      iniciarScheduler();
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;

