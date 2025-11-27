const { query, transaction } = require('../database.js'); // Adicionando 'transaction' para uso futuro e completude
const path = require('path');

// ==================== ABRIR CRUD PESSOA/CLIENTE ====================
exports.abrirCrudPessoa = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pessoa/pessoa.html'));
};


// ==================== CRIAR NOVO USUÁRIO (POST /pessoas) ====================
// Esta função lida apenas com a criação de contas de login (tabela: usuario)
exports.criarUsuario = async (req, res) => {
  try {
    const { nomeUsuario, email, senha } = req.body; // Mantendo o camelCase para o input do front-end

    if (!nomeUsuario || !email || !senha) {
      return res.status(400).json({ status: 'erro', mensagem: 'Campos obrigatórios faltando' });
    }

    // Query Corrigida: Tabela 'usuario', Colunas 'nomeusuario', 'email', 'senha'
    const result = await query(
      'INSERT INTO usuario (nomeusuario, email, senha) VALUES ($1, $2, $3) RETURNING idusuario',
      [nomeUsuario, email, senha]
    );

    res.status(201).json({ status: 'ok', idUsuario: result.rows[0].idusuario });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    if (error.code === '23505') { // Código de violação de Unique Constraint
      return res.status(409).json({ status: 'erro', mensagem: 'Email já cadastrado.' });
    }
    res.status(500).json({ status: 'erro', mensagem: 'Erro interno do servidor' });
  }
};

// ==================== LISTAR USUÁRIOS (GET /pessoas/usuarios) ====================
exports.listarUsuarios = async (req, res) => {
  try {
    // Query Corrigida: Tabela 'usuario', Colunas 'idusuario', 'nomeusuario'
    const result = await query('SELECT idusuario, nomeusuario, email FROM usuario ORDER BY idusuario');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ status: 'erro', mensagem: 'Erro interno do servidor' });
  }
};


// ==================== OBTER CLIENTE (GET /pessoas/:id) ====================
exports.obterPessoa = async (req, res) => {
  try {
    const idCliente = parseInt(req.params.idUsuario); // idUsuario da rota é o idCliente
    if (isNaN(idCliente)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    // Query Corrigida: Tabela 'cliente', Colunas 'idcliente', 'nomecliente'
    const result = await query('SELECT idcliente, nomecliente, email FROM cliente WHERE idcliente = $1', [idCliente]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==================== ATUALIZAR CLIENTE (PUT /pessoas/:id) ====================
exports.atualizarPessoa = async (req, res) => {
  try {
    const idCliente = parseInt(req.params.idUsuario);
    const { nomeCliente, email } = req.body; // Mantendo o camelCase para o input do front-end

    // Query Corrigida: Tabela 'cliente', Colunas 'idcliente'
    const existing = await query('SELECT idcliente, nomecliente, email FROM cliente WHERE idcliente = $1', [idCliente]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    // Query Corrigida: Tabela 'cliente', Colunas 'nomecliente', 'idcliente'
    const updated = await query(
      'UPDATE cliente SET nomecliente = $1, email = $2 WHERE idcliente = $3 RETURNING idcliente, nomecliente, email',
      [
        nomeCliente || existing.rows[0].nomecliente, // Nomeclatura da linha existente corrigida para minúsculo
        email || existing.rows[0].email,
        idCliente
      ]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    if (error.code === '23505') { 
      return res.status(409).json({ status: 'erro', mensagem: 'Email já cadastrado em outro cliente.' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==================== DELETAR CLIENTE (DELETE /pessoas/:id) ====================
exports.deletarPessoa = async (req, res) => {
  try {
    const idCliente = parseInt(req.params.idusuario);

    // Query Corrigida: Tabela 'cliente', Colunas 'idcliente'
    const existing = await query('SELECT idcliente FROM cliente WHERE idcliente = $1', [idCliente]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    // Query Corrigida: Tabela 'cliente', Colunas 'idcliente'. DELETE é feito em cascata nos pedidos.
    await query('DELETE FROM cliente WHERE idcliente = $1', [idCliente]);
    res.status(200).json({ status: 'ok', mensagem: 'Cliente deletado com sucesso.' });
  } catch (error) {
    // 23503: foreign_key_violation - Impossível se o ON DELETE SET NULL estiver no pedido
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};