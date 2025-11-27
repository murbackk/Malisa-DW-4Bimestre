const { query, transaction } = require('../database.js');

// ==================== CRIAR NOVO PEDIDO (POST /pedido) ====================
exports.createPedido = async (req, res) => {
  // idCliente na rota /pessoa (tabela cliente)
  // idUsuario na rota /login (tabela usuario, que é o funcionário logado)
  const { idCliente, idUsuario, produtos } = req.body; 

  if (!idCliente || !idUsuario || !produtos || produtos.length === 0) {
      return res.status(400).json({ message: "Dados incompletos para criar pedido." });
  }
  
  try {
    const pedidoId = await transaction(async (client) => {
      // 1. Calcula o valor total
      let valorTotal = 0;
      produtos.forEach(prod => {
        valorTotal += prod.precounitario * prod.quantidade; // Assumindo que o preço unitário veio do front
      });

      // 2. Cria o registro na tabela PEDIDO
      const newPedido = await client.query(
        `INSERT INTO pedido (idcliente, idusuario, valortotal, datapedido)
         VALUES ($1, $2, $3, NOW()) RETURNING idpedido`,
        [idCliente, idUsuario, valorTotal]
      );
      const pedidoId = newPedido.rows[0].idpedido;

      // 3. Insere os produtos na tabela PEDIDOPRODUTO (tabela N:N)
      for (const prod of produtos) {
        await client.query(
          `INSERT INTO pedidoproduto (idpedido, idproduto, quantidade, precounitario)
           VALUES ($1, $2, $3, $4)`,
          [pedidoId, prod.idproduto, prod.quantidade, prod.precounitario]
        );
      }
      return pedidoId;
    });

    res.json({ message: "Pedido e produtos criados com sucesso!", idPedido: pedidoId });
  } catch (err) {
    console.error("Erro ao criar pedido:", err.message);
    res.status(500).send('Erro interno do servidor ao criar pedido');
  }
};

// ==================== LISTAR TODOS OS PEDIDOS (GET /pedido) ====================
exports.getPedidos = async (req, res) => {
  try {
    const querySQL = `
      SELECT 
        p.idpedido, p.datapedido, p.valortotal, 
        c.nomecliente, 
        u.nomeusuario AS nomefuncionario,
        CASE WHEN pg.idpedido IS NOT NULL THEN 'Pago' ELSE 'Pendente' END AS status
      FROM pedido p
      LEFT JOIN cliente c ON p.idcliente = c.idcliente
      LEFT JOIN usuario u ON p.idusuario = u.idusuario
      LEFT JOIN pagamento pg ON p.idpedido = pg.idpedido
      ORDER BY p.datapedido DESC
    `;
    const pedidos = await req.db.query(querySQL);
    res.json(pedidos.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro ao buscar pedidos');
  }
};

// ==================== OBTER UM ÚNICO PEDIDO (GET /pedido/:id) ====================
exports.getPedido = async (req, res) => {
  const id = req.params.id;
  try {
    const queryPedido = `
      SELECT 
        p.idpedido, p.datapedido, p.valortotal, 
        p.idcliente, c.nomecliente, c.email AS emailcliente,
        p.idusuario, u.nomeusuario AS nomefuncionario,
        CASE WHEN pg.idpedido IS NOT NULL THEN 'Pago' ELSE 'Pendente' END AS status
      FROM pedido p
      LEFT JOIN cliente c ON p.idcliente = c.idcliente
      LEFT JOIN usuario u ON p.idusuario = u.idusuario
      LEFT JOIN pagamento pg ON p.idpedido = pg.idpedido
      WHERE p.idpedido = $1
    `;
    const pedidoResult = await req.db.query(queryPedido, [id]);
    
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    const queryItens = `
      SELECT 
        pp.idproduto, pp.quantidade, pp.precounitario,
        pr.nomeproduto
      FROM pedidoproduto pp
      JOIN produto pr ON pp.idproduto = pr.idproduto
      WHERE pp.idpedido = $1
    `;
    const itensResult = await req.db.query(queryItens, [id]);
    
    const pedido = pedidoResult.rows[0];
    pedido.itens = itensResult.rows;

    res.json(pedido);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro ao buscar pedido');
  }
};

// ==================== ATUALIZAR PEDIDO (PUT /pedido/:id) ====================
// Nota: A atualização de pedido é complexa (envolve mudar itens, recalcular total).
// Esta versão básica apenas atualiza a info principal e itens separadamente (se for o caso).
exports.updatePedido = async (req, res) => {
  const id = req.params.id;
  const { idCliente, idUsuario, valortotal, status, produtos } = req.body;
  
  // Implementação simplificada:
  const queryPedido = `
    UPDATE pedido 
    SET idcliente = $1, idusuario = $2, valortotal = $3
    WHERE idpedido = $4 
    RETURNING idpedido
  `;
  
  try {
    await transaction(async (client) => {
      // 1. Atualiza o registro principal
      const pedidoResult = await client.query(queryPedido, [idCliente, idUsuario, valortotal, id]);

      if (pedidoResult.rows.length === 0) {
        throw new Error("Pedido não encontrado para atualização.");
      }

      // 2. Se houver itens para atualizar/substituir
      if (produtos && Array.isArray(produtos)) {
        // Deleta os itens existentes e insere os novos
        await client.query("DELETE FROM pedidoproduto WHERE idpedido = $1", [id]);
        
        for (const prod of produtos) {
          await client.query(
            `INSERT INTO pedidoproduto (idpedido, idproduto, quantidade, precounitario)
             VALUES ($1, $2, $3, $4)`,
            [id, prod.idproduto, prod.quantidade, prod.precounitario]
          );
        }
      }
      
      // 3. Atualiza o status (se enviado, embora o pagamentoController faça isso)
      // Esta lógica é complexa e deve ser tratada com cuidado.
      // Apenas fazemos o update principal.

      res.json({ message: "Pedido atualizado com sucesso!", idPedido: id });
    });
  } catch (err) {
     if (err.message.includes("Pedido não encontrado")) {
        return res.status(404).json({ message: err.message });
     }
    console.error("Erro ao atualizar pedido:", err.message);
    res.status(500).send('Erro interno do servidor ao atualizar pedido');
  }
};

// ==================== DELETAR PEDIDO (DELETE /pedido/:id) ====================
exports.deletePedido = async (req, res) => {
  const id = req.params.id;
  try {
    // A exclusão em cascata deve cuidar de 'pedidoproduto' e 'pagamento'
    const deleted = await req.db.query("DELETE FROM pedido WHERE idpedido = $1 RETURNING idpedido", [id]);
    
    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: "Pedido não encontrado" });
    }

    res.json({ message: "Pedido deletado com sucesso!" });
  } catch (err) {
    // 23503: foreign_key_violation (impossível se ON DELETE CASCADE está correto)
    console.error(err.message);
    res.status(500).send('Erro ao deletar pedido');
  }
};


// ==================== ROTAS AUXILIARES ====================

// Funções auxiliares para o frontend (formulários de pedidos)
exports.getClientes = async (req, res) => {
  try {
    // Seleciona o ID e o nome para o dropdown
    const clientes = await req.db.query(
      "SELECT idcliente, nomecliente FROM cliente ORDER BY nomecliente ASC"
    );
    res.json(clientes.rows);
  } catch (err) {
    res.status(500).send('Erro ao buscar clientes');
  }
};

exports.getFuncionarios = async (req, res) => {
  try {
   const funcionarios = await req.db.query(`
      SELECT u.idusuario, u.nomeusuario
      FROM usuario u
      JOIN funcionario f ON u.idusuario = f.idusuario
      ORDER BY u.nomeusuario ASC
   `);
    res.json(funcionarios.rows);
  } catch (err) {
    res.status(500).send('Erro ao buscar funcionários');
  }
};

exports.getProdutos = async (req, res) => {
  try {
    const produtos = await req.db.query(`
      SELECT idproduto, nomeproduto, precounitario
      FROM produto
      ORDER BY nomeproduto ASC
    `);
    res.json(produtos.rows);
  } catch (err) {
    res.status(500).send('Erro ao buscar produtos');
  }
};