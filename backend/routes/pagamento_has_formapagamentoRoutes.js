const express = require('express');
const router = express.Router();
const pagamento_has_formapagamentoController = require('../controllers/pagamento_has_formapagamentoController');

// CRUD completo
router.get('/abrirCrudPagamento_has_formapagamento', pagamento_has_formapagamentoController.abrirCrudPagamento_has_formapagamento);
router.get('/', pagamento_has_formapagamentoController.listar);
router.post('/', pagamento_has_formapagamentoController.criar);
router.get('/:id', pagamento_has_formapagamentoController.obter);
router.put('/:id', pagamento_has_formapagamentoController.atualizar);
router.delete('/:id', pagamento_has_formapagamentoController.deletar);

module.exports = router;
