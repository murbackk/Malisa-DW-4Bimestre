const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');

// ==================== ROTAS DO CRUD DE FUNCIONÁRIOS ====================

// Abre a página HTML do CRUD
router.get('/abrirCrudFuncionario', funcionarioController.abrirCrudFuncionario);

// Listar todos os funcionários
router.get('/', funcionarioController.listarFuncionarios);

// Criar um novo funcionário
router.post('/', funcionarioController.criarFuncionario);

// Obter um funcionário pelo ID
router.get('/:id', funcionarioController.obterFuncionario);

// Atualizar funcionário pelo ID
router.put('/:id', funcionarioController.atualizarFuncionario);

// Deletar funcionário pelo ID
router.delete('/:id', funcionarioController.deletarFuncionario);

module.exports = router;