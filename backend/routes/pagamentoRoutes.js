const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');

// Abre a página de pagamento (opcional, se houver um pagamento.html)
router.get('/abrirPaginaPagamento', pagamentoController.abrirPaginaPagamento);

// Registrar pagamento de um pedido
router.post('/', pagamentoController.registrarPagamento);

// Listar todos os pagamentos
router.get('/', pagamentoController.listarPagamentos);

module.exports = router;
