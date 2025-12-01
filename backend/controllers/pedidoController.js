const { query, transaction } = require('../database.js');

// ==================== CRIAR NOVO PEDIDO (POST /pedido) ====================
exports.createPedido = async (req, res) => {
  const { idCliente, idUsuario, produtos } = req.body;

  if (!idCliente || !idUsuario || !produtos || produtos.length === 0) {
    return res.status(400).json({ message: "Dados incompletos para criar pedido." });
  }

  try {
    const pedidoId = await transaction(async (client) => {

      // 1. Calcula o valor total
      let valorTotal = 0;
      produtos.forEach(prod => {
        valorTotal += prod.precoUnitario * prod.quantidade; 
      });

      // 2. Insere na tabela PEDIDO
      const newPedido = await client.query(
        `INSERT INTO pedido (idcliente, idusuario, valortotal, datapedido)
         VALUES ($1, $2, $3, NOW()) RETURNING idpedido`,
        [idCliente, idUsuario, valorTotal]
      );

      const pedidoId = newPedido.rows[0].idpedido;

      // 3. Insere na tabela PEDIDOPRODUTO
      for (const prod of produtos) {
        await client.query(
          `INSERT INTO pedidoproduto (idpedido, idproduto, quantidade, precounitario)
           VALUES ($1, $2, $3, $4)`,
          [pedidoId, prod.idProduto, prod.quantidade, prod.precoUnitario]
        );
      }

      return pedidoId;
    });

    res.status(201).json({ 
      message: "Pedido e produtos criados com sucesso!", 
      idPedido: pedidoId 
    });

  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    res.status(500).send('Erro interno do servidor ao criar pedido');
  }
};

// ==================== LISTAR TODOS OS PEDIDOS (GET /pedido) ====================
exports.getPedidos = async (req, res) => {
  try {
    const querySQL = `
      SELECT 
        p.idpedido, p.datapedido, p.valortotal, 
        c.idcliente,
        u.nomeusuario AS nomeusuario,
        (SELECT u2.nomeusuario FROM usuario u2 WHERE u2.idusuario = c.idusuario) AS nomecliente
      FROM pedido p
      LEFT JOIN cliente c ON p.idcliente = c.idcliente
      LEFT JOIN usuario u ON p.idusuario = u.idusuario
      ORDER BY p.datapedido DESC
    `;
    const pedidos = await req.db.query(querySQL);
    res.json(pedidos.rows);
  } catch (err) {
    console.error("Erro ao listar pedidos:", err.message);
    res.status(500).send('Erro ao buscar pedidos');
  }
};

// ==================== OBTER UM ÚNICO PEDIDO (GET /pedido/:id) ====================
exports.getPedido = async (req, res) => {
  const id = req.params.id;

  try {
    // Buscar dados do pedido
    const queryPedido = `
      SELECT 
        p.idpedido, p.datapedido, p.valortotal, 
        p.idcliente, 
        (SELECT u.nomeusuario FROM usuario u WHERE u.idusuario = c.idusuario) AS nomecliente,
        p.idusuario, 
        u.nomeusuario AS nomefuncionario
      FROM pedido p
      LEFT JOIN cliente c ON p.idcliente = c.idcliente
      LEFT JOIN usuario u ON p.idusuario = u.idusuario
      WHERE p.idpedido = $1
    `;
    const pedidoResult = await req.db.query(queryPedido, [id]);

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    const pedido = pedidoResult.rows[0];

    // Buscar itens do pedido
    const queryItens = `
      SELECT 
        pp.idproduto, 
        pp.quantidade, 
        pp.precounitario,
        pr.nomeproduto
      FROM pedidoproduto pp
      JOIN produto pr ON pp.idproduto = pr.idproduto
      WHERE pp.idpedido = $1
    `;
    const itensResult = await req.db.query(queryItens, [id]);

    // Formato esperado pelo FRONT:
    res.json({
      pedido: pedido,
      produtos: itensResult.rows
    });

  } catch (err) {
    console.error("Erro ao buscar pedido:", err);
    res.status(500).send('Erro ao buscar pedido');
  }
};

// ==================== ATUALIZAR PEDIDO (PUT /pedido/:id) ====================
exports.updatePedido = async (req, res) => {
  const id = req.params.id;
  const { idCliente, idUsuario, produtos } = req.body;

  try {
    await transaction(async (client) => {

      // Recalcular o valor total
      let valorTotal = 0;
      produtos.forEach(prod => {
        valorTotal += prod.precoUnitario * prod.quantidade;
      });

      // Atualiza o pedido
      const pedidoResult = await client.query(
        `UPDATE pedido
         SET idcliente = $1, idusuario = $2, valortotal = $3
         WHERE idpedido = $4
         RETURNING idpedido`,
        [idCliente, idUsuario, valorTotal, id]
      );

      if (pedidoResult.rows.length === 0) {
        throw new Error("Pedido não encontrado para atualização.");
      }

      // Apaga itens antigos
      await client.query("DELETE FROM pedidoproduto WHERE idpedido = $1", [id]);

      // Insere itens novos
      for (const prod of produtos) {
        await client.query(
          `INSERT INTO pedidoproduto (idpedido, idproduto, quantidade, precounitario)
           VALUES ($1, $2, $3, $4)`,
          [id, prod.idProduto, prod.quantidade, prod.precoUnitario]
        );
      }
    });

    res.json({ message: "Pedido atualizado com sucesso!", idPedido: id });

  } catch (err) {
    console.error("Erro ao atualizar pedido:", err.message);
    res.status(500).send('Erro interno do servidor ao atualizar pedido');
  }
};

// ==================== DELETAR PEDIDO (DELETE /pedido/:id) ====================
exports.deletePedido = async (req, res) => {
  const id = req.params.id;

  try {
    const deleted = await req.db.query(
      "DELETE FROM pedido WHERE idpedido = $1 RETURNING idpedido",
      [id]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    res.json({ message: "Pedido deletado com sucesso!" });

  } catch (err) {
    console.error("Erro ao deletar pedido:", err.message);
    res.status(500).send('Erro ao deletar pedido');
  }
};

// ==================== ROTAS AUXILIARES (clientes, funcionários, produtos) ====================

// Retorna clientes (nome via usuário)
exports.getClientes = async (req, res) => {
  try {
    const clientes = await req.db.query(`
      SELECT 
        c.idcliente,
        u.nomeusuario AS nomecliente
      FROM cliente c
      JOIN usuario u ON u.idusuario = c.idusuario
      ORDER BY u.nomeusuario ASC
    `);
    res.json(clientes.rows);
  } catch (err) {
    console.error("Erro ao buscar clientes:", err.message);
    res.status(500).send('Erro ao buscar clientes');
  }
};

// Retorna funcionários com nome e cargo
exports.getFuncionarios = async (req, res) => {
  try {
    const funcionarios = await req.db.query(`
      SELECT 
        f.idfuncionario,
        u.nomeusuario AS nomefuncionario,
        c.nomecargo
      FROM funcionario f
      JOIN usuario u ON u.idusuario = f.idusuario
      JOIN cargo c ON c.idcargo = f.idcargo
      ORDER BY u.nomeusuario ASC
    `);
    res.json(funcionarios.rows);
  } catch (err) {
    console.error("Erro ao buscar funcionários:", err.message);
    res.status(500).send('Erro ao buscar funcionários');
  }
};

// Retorna produtos
exports.getProdutos = async (req, res) => {
  try {
    const produtos = await req.db.query(`
      SELECT idproduto, nomeproduto, precounitario
      FROM produto
      ORDER BY nomeproduto ASC
    `);
    res.json(produtos.rows);
  } catch (err) {
    console.error("Erro ao buscar produtos:", err.message);
    res.status(500).send('Erro ao buscar produtos');
  }
};
