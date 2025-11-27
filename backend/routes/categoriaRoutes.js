const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

// Listar todas as categorias
router.get('/', categoriaController.listarCategorias);

// Criar categoria
router.post('/', categoriaController.criarCategoria);

// Obter categoria
router.get('/:idCategoria', categoriaController.obterCategoria);

// Atualizar categoria
router.put('/:idCategoria', categoriaController.atualizarCategoria);

// Deletar categoria
router.delete('/:idCategoria', categoriaController.deletarCategoria);

module.exports = router;