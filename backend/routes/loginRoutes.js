const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// Rotas de autenticação
router.post('/verificarEmail', loginController.verificarEmail);
router.post('/verificarSenha', loginController.verificarSenha);
router.post('/verificaSeUsuarioEstaLogado', loginController.verificaSeUsuarioEstaLogado);
router.post('/logout', loginController.logout);
router.get('/verificarGerente', loginController.verificarGerente);


module.exports = router;
