const { transaction } = require('../database');

// ================================
// LISTAR ITENS DE UM PEDIDO
// GET /pedido-item/:idpedido
// ================================
exports.getItensByPedido = async (req, res) => {
    const { idpedido } = req.params;

    try {
        const itens = await req.db.query(
            `SELECT 
                pp.idpedido,
                pp.idproduto,
                pp.quantidade,
                pp.precounitario,
                p.nomeproduto
             FROM pedidoproduto pp
             JOIN produto p ON p.idproduto = pp.idproduto
             WHERE pp.idpedido = $1`,
            [idpedido]
        );

        res.json(itens.rows);

    } catch (err) {
        console.error("Erro ao buscar itens do pedido:", err);
        res.status(500).json({ message: "Erro ao buscar itens do pedido." });
    }
};


// ================================
// CRIAR ITEM EM UM PEDIDO
// POST /pedido-item
// ================================
exports.createItem = async (req, res) => {
    const { idpedido, idProduto, quantidade, precoUnitario } = req.body;

    if (!idpedido || !idProduto || !quantidade || !precoUnitario) {
        return res.status(400).json({ message: "Dados incompletos." });
    }

    try {
        await req.db.query(
            `INSERT INTO pedidoproduto (idpedido, idproduto, quantidade, precounitario)
             VALUES ($1, $2, $3, $4)`,
            [idpedido, idProduto, quantidade, precoUnitario]
        );

        res.status(201).json({ message: "Item adicionado ao pedido." });

    } catch (err) {
        console.error("Erro ao criar item:", err);
        res.status(500).json({ message: "Erro ao criar item." });
    }
};


// ================================
// ATUALIZAR ITEM ESPECÍFICO
// PUT /pedido-item/:idpedido/:idproduto
// ================================
exports.updateItem = async (req, res) => {
    const { idpedido, idproduto } = req.params;
    const { quantidade, precoUnitario } = req.body;

    if (!quantidade || !precoUnitario) {
        return res.status(400).json({ message: "Dados incompletos." });
    }

    try {
        const result = await req.db.query(
            `UPDATE pedidoproduto
             SET quantidade = $1, precounitario = $2
             WHERE idpedido = $3 AND idproduto = $4
             RETURNING *`,
            [quantidade, precoUnitario, idpedido, idproduto]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Item não encontrado." });
        }

        res.json({ message: "Item atualizado com sucesso!" });

    } catch (err) {
        console.error("Erro ao atualizar item:", err);
        res.status(500).json({ message: "Erro ao atualizar item." });
    }
};


// ================================
// DELETAR ITEM ESPECÍFICO
// DELETE /pedido-item/:idpedido/:idproduto
// ================================
exports.deleteItem = async (req, res) => {
    const { idpedido, idproduto } = req.params;

    try {
        const result = await req.db.query(
            `DELETE FROM pedidoproduto
             WHERE idpedido = $1 AND idproduto = $2
             RETURNING *`,
            [idpedido, idproduto]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Item não encontrado." });
        }

        res.json({ message: "Item removido com sucesso!" });

    } catch (err) {
        console.error("Erro ao deletar item:", err);
        res.status(500).json({ message: "Erro ao deletar item." });
    }
};
