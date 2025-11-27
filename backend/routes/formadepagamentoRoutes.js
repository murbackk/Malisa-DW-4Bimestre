const express = require('express');
const router = express.Router();
const formadepagamentoController = require('../controllers/formadepagamentoController');

// Rotas do CRUD de formadepagamentos

// Abre a página HTML do CRUD
router.get('/abrirCrudFormadepagamento', formadepagamentoController.abrirCrudFormadepagamento);

// Listar todos os formadepagamentos
router.get('/', formadepagamentoController.listarFormadepagamentos);

// Criar um novo formadepagamento
router.post('/', formadepagamentoController.criarFormadepagamento);

// Obter um formadepagamento pelo ID
router.get('/:id', formadepagamentoController.obterFormadepagamento);

// Atualizar formadepagamento pelo ID
router.put('/:id', formadepagamentoController.atualizarFormadepagamento);

// Deletar formadepagamento pelo ID
router.delete('/:id', formadepagamentoController.deletarFormadepagamento);

module.exports = router;
