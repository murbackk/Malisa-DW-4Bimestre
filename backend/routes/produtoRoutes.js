const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

// Abre o CRUD
router.get('/abrirCrudproduto', produtoController.abrirCrudproduto);

// Listar todos os produtos
router.get('/', produtoController.listarprodutos);

// Criar produto (com imagem opcional)
router.post('/', produtoController.uploadImagem, produtoController.criarproduto);

// Obter produto
router.get('/:idproduto', produtoController.obterproduto);

// Obter imagem do produto
router.get('/:idproduto/imagem', produtoController.obterImagemproduto);

// Atualizar produto (com imagem opcional)
router.put('/:idproduto', produtoController.uploadImagem, produtoController.atualizarproduto);

// Deletar produto
router.delete('/:idproduto', produtoController.deletarproduto);

module.exports = router;
