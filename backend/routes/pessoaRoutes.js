const express = require('express');
const router = express.Router();
const pessoaController = require('../controllers/pessoaController');

// Rotas do CRUD de pessoas

router.post('/', pessoaController.criarUsuario);

router.get('/', pessoaController.listarUsuarios);

// Abre a página HTML do CRUD
router.get('/abrirCrudPessoa', pessoaController.abrirCrudPessoa);

// Obter um pessoa pelo idUsuario
router.get('/:idusuario', pessoaController.obterPessoa);

// Atualizar pessoa pelo idUsuario
router.put('/:idusuario', pessoaController.atualizarPessoa);

// Deletar pessoa pelo idUsuario
router.delete('/:idusuario', pessoaController.deletarPessoa);



exports.verificarGerente = async (req, res) => {
    const { idusuario } = req.query;
    try {
        const query = `
            SELECT f.idusuario, c.codigocargo
            FROM funcionario f
            JOIN cargo c ON f.codigocargo = c.codigocargo
            WHERE f.idusuario = ? AND c.codigocargo IN ('GER123', 'WEB456')
        `;
        const result = await db.query(query, [idUsuario]);
        res.json({ isGerente: result.length > 0 });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar gerente' });
    }
};

module.exports = router;







