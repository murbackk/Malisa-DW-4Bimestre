const express = require('express');
const router = express.Router();
const cargoController = require('../controllers/cargoController');

// ==================== ROTAS DO CRUD DE CARGOS ====================

// Abre a página HTML do CRUD
router.get('/abrirCrudCargo', cargoController.abrirCrudCargo);

// Listar todos os cargos
router.get('/', cargoController.listarCargos);

// Criar um novo cargo
router.post('/', cargoController.criarCargo);

// Verificar se código de cargo existe (DEVE vir antes da rota /:id)
router.post('/verificarCodigo', cargoController.verificarCodigoCargo);

// Obter um cargo pelo ID
router.get('/:id', cargoController.obterCargo);

// Atualizar cargo pelo ID
router.put('/:id', cargoController.atualizarCargo);

// Deletar cargo pelo ID
router.delete('/:id', cargoController.deletarCargo);

module.exports = router;