const express = require('express');
const router = express.Router();
const controller = require('../controllers/pedidoprodutoController');

// Lista todos os itens de um pedido
router.get('/:idpedido', controller.getItensByPedido);

// Adiciona item ao pedido
router.post('/', controller.createItem);

// Atualiza item específico
router.put('/:idpedido/:idproduto', controller.updateItem);

// Remove item específico
router.delete('/:idpedido/:idproduto', controller.deleteItem);

module.exports = router;
