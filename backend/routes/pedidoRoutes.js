const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Rota para criar um novo pedido
router.post('/', pedidoController.createPedido);

// Rotas auxiliares para dados dos formulários
router.get('/clientes', pedidoController.getClientes);
router.get('/funcionarios', pedidoController.getFuncionarios);
router.get('/produtos', pedidoController.getProdutos);

// Rota para buscar todos os pedidos
router.get('/', pedidoController.getPedidos);

// Rota para buscar um único pedido
router.get('/:id', pedidoController.getPedido);

// Rota para atualizar um pedido
router.put('/:id', pedidoController.updatePedido);

// Rota para deletar um pedido
router.delete('/:id', pedidoController.deletePedido);

module.exports = router;
