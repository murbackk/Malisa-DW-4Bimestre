const db = require('../database');

exports.abrirCrudCargo = (req, res) => {
    // Como esta é uma rota para 'Abrir a página HTML do CRUD', 
    // ela deve enviar o arquivo HTML para o cliente.
    
    // Exemplo (ajuste o caminho se necessário):
    res.sendFile('crudCargo.html', { root: 'frontend/views' }); 
};

exports.verificarCodigoCargo = async (req, res) => {
    const { codigocargo } = req.body;
    try {
        const query = `
            SELECT idcargo 
            FROM cargos 
            WHERE codigocargo = $1
        `;
        const result = await req.db.query(query, [codigocargo]);

        // Retorna true se houver linhas (código existe), false se não houver
        const existe = result.rows.length > 0;
        
        // Se o código já existe, retorne 409 (Conflict) ou um status de erro/aviso
        if (existe) {
             return res.status(409).json({ existe: true, msg: 'Código de cargo já está em uso.' });
        }
        
        // Se não existe, retorne 200 (OK)
        res.status(200).json({ existe: false, msg: 'Código de cargo disponível.' });

    } catch (error) {
        console.error('Erro ao verificar código de cargo:', error);
        res.status(500).json({ msg: 'Erro ao verificar código.' });
    }
};

// ==================== LISTAR TODOS OS CARGOS (GET /cargos) ====================
exports.listarCargos = async (req, res) => {
    try {
        const query = `
            SELECT 
                idcargo AS idcargo,
                nomecargo AS nomecargo,
                codigocargo AS codigocargo
            FROM cargos
            ORDER BY nomecargo
        `;
        const result = await req.db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao listar cargos:', error);
        res.status(500).json({ msg: 'Erro ao buscar cargos.' });
    }
};

// ==================== CRIAR CARGO (POST /cargos) ====================
exports.criarCargo = async (req, res) => {
    const { nomecargo, codigocargo } = req.body;
    try {
        const query = `
            INSERT INTO cargos (nomecargo, codigocargo)
            VALUES ($1, $2)
            RETURNING idcargo
        `;
        const result = await req.db.query(query, [nomecargo, codigocargo]);

        res.status(201).json({
            idcargo: result.rows[0].idcargo,
            nomecargo,
            codigocargo,
            msg: 'Cargo criado com sucesso.'
        });
    } catch (error) {
        if (error.code === '23505') { 
            return res.status(409).json({ msg: 'Código de cargo já existe.' });
        }
        console.error('Erro ao criar cargo:', error);
        res.status(500).json({ msg: 'Erro ao criar cargo.' });
    }
};

// ==================== OBTER CARGO (GET /cargos/:id) ====================
exports.obterCargo = async (req, res) => {
    const id = req.params.id;
    try {
        const query = `
            SELECT 
                idcargo AS idcargo,
                nomecargo AS nomecargo,
                codigocargo AS codigocargo
            FROM cargos
            WHERE idcargo = $1
        `;
        const result = await req.db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Cargo não encontrado.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao obter cargo:', error);
        res.status(500).json({ msg: 'Erro ao obter cargo.' });
    }
};

// ==================== ATUALIZAR CARGO (PUT /cargos/:id) ====================
exports.atualizarCargo = async (req, res) => {
    const id = req.params.id;
    const { nomecargo, codigocargo } = req.body;
    try {
        const query = `
            UPDATE cargos 
            SET nomecargo = $1, codigocargo = $2
            WHERE idcargo = $3
            RETURNING idcargo
        `;
        const result = await req.db.query(query, [nomecargo, codigocargo, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Cargo não encontrado para atualização.' });
        }

        res.status(200).json({ msg: 'Cargo atualizado com sucesso.' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ msg: 'Código já existe.' });
        }
        console.error('Erro ao atualizar cargo:', error);
        res.status(500).json({ msg: 'Erro ao atualizar cargo.' });
    }
};

// ==================== DELETAR CARGO (DELETE /cargos/:id) ====================
exports.deletarCargo = async (req, res) => {
    const id = req.params.id;
    try {
        const query = `
            DELETE FROM cargos 
            WHERE idcargo = $1
            RETURNING idcargo
        `;
        const result = await req.db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Cargo não encontrado para exclusão.' });
        }

        res.status(200).json({ msg: 'Cargo deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar cargo:', error);
        res.status(500).json({ msg: 'Erro ao deletar cargo.' });
    }
};
