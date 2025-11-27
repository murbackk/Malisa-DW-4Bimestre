const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./database');


app.use(express.static(path.join(__dirname, '../')));
app.use('/imgs', express.static(path.join(__dirname, '../imgs')));
app.use('/css', express.static(path.join(__dirname, '../')));

// ==================== CONFIGURAÇÕES ====================

// Origens permitidas
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5500',
  'http://localhost:5501',
  'http://localhost:3000'
];

const HOST = '0.0.0.0';
const PORT_FIXA = 3001;

// ==================== CORS MANUAL (EXPRESS 5 COMPATÍVEL) ====================

app.use((req, res, next) => {
  const origin = req.headers.origin; // Pode ser undefined ou null

  console.log("🌐 CORS solicitando origem:", origin);

  // 1. Verifica se 'origin' existe e se está na lista permitida
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  // 2. Se a origem não for definida (ex: requisição no mesmo domínio), 
  // pode ser necessário adicionar um fallback ou aceitar * (menos seguro)
  // Como as suas origens permitidas cobrem as que você está usando (127.0.0.1 e localhost), 
  // esta checagem acima deve ser suficiente.

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") {
    // Certifique-se de que se a origem for permitida, o header ACAO foi configurado aqui também.
    // Se o ACAO não for configurado no preflight (OPTIONS), a requisição real (GET/POST) falhará.
    return res.sendStatus(204); 
  }

  next();
});

// ==================== OUTROS MIDDLEWARES ====================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Disponibiliza db nas requisições
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ==================== ROTAS ====================

const loginRoutes = require('./routes/loginRoutes');
const menuRoutes = require('./routes/menuRoutes');
const cargoRoutes = require('./routes/cargoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const formadepagamentoRoutes = require('./routes/formadepagamentoRoutes');
const funcionariosRoutes = require('./routes/funcionariosRoutes');
const pessoaRoutes = require('./routes/pessoaRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes');

app.use('/login', loginRoutes);
app.use('/menu', menuRoutes);
app.use('/cargos', cargoRoutes);
app.use('/categoria', categoriaRoutes);
app.use('/formadepagamento', formadepagamentoRoutes);
app.use('/funcionario', funcionariosRoutes);
app.use('/pessoa', pessoaRoutes);
app.use('/produto', produtoRoutes);
app.use('/pedido', pedidoRoutes);
app.use('/pagamento', pagamentoRoutes);

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ==================== INICIAR SERVIDOR ====================

db.testConnection().then(isReady => {
  if (isReady) {
    app.listen(PORT_FIXA, HOST, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT_FIXA}`);
    });
  } else {
    console.error('❌ Servidor não pode iniciar sem conexão com o banco de dados.');
  }
});
