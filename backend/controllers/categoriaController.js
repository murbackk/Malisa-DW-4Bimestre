const { query } = require('../database');

// Listar todas as categorias
exports.listarCategorias = async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM Categoria
      ORDER BY idCategoria
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar uma nova categoria
exports.criarCategoria = async (req, res) => {
  try {
    const { nomeCategoria, descricao } = req.body;

    if (!nomeCategoria) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    const result = await query(
      `INSERT INTO Categoria (nomeCategoria, descricao)
       VALUES ($1, $2) RETURNING *`,
      [nomeCategoria, descricao || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter uma categoria pelo ID
exports.obterCategoria = async (req, res) => {
  try {
    const idCategoria = parseInt(req.params.idCategoria);
    if (isNaN(idCategoria)) {
      return res.status(400).json({ error: 'ID da categoria inválido' });
    }

    const result = await query(
      'SELECT * FROM Categoria WHERE idCategoria = $1',
      [idCategoria]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar categoria
exports.atualizarCategoria = async (req, res) => {
  try {
    const idCategoria = parseInt(req.params.idCategoria);
    const { nomeCategoria, descricao } = req.body;

    const existing = await query('SELECT * FROM Categoria WHERE idCategoria = $1', [idCategoria]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    const result = await query(
      `UPDATE Categoria 
       SET nomeCategoria = $1,
           descricao = $2
       WHERE idCategoria = $3
       RETURNING *`,
      [
        nomeCategoria || existing.rows[0].nomecategoria,
        descricao !== undefined ? descricao : existing.rows[0].descricao,
        idCategoria
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar categoria
exports.deletarCategoria = async (req, res) => {
  try {
    const idCategoria = parseInt(req.params.idCategoria);

    const existing = await query('SELECT * FROM Categoria WHERE idCategoria = $1', [idCategoria]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    await query('DELETE FROM Categoria WHERE idCategoria = $1', [idCategoria]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar a categoria porque ela está vinculada a produtos'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};