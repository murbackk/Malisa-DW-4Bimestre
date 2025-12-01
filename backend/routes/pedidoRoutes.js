const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// ========== ROTAS AUXILIARES (devem vir ANTES de /:id) ==========
router.get('/clientes', pedidoController.getClientes);
router.get('/funcionarios', pedidoController.getFuncionarios);
router.get('/produtos', pedidoController.getProdutos);

// ========== CRUD PRINCIPAL DE PEDIDOS ==========
router.post('/', pedidoController.createPedido);      // Criar pedido
router.get('/', pedidoController.getPedidos);         // Listar pedidos
router.get('/:id', pedidoController.getPedido);       // Obter pedido por ID
router.put('/:id', pedidoController.updatePedido);    // Atualizar pedido
router.delete('/:id', pedidoController.deletePedido); // Deletar pedido

module.exports = router;
