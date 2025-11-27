const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// Rotas de autenticação

router.get('/', menuController.abrirMenu);
router.post('/logout', menuController.logout);

module.exports = router;
