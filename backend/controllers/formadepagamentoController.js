const { query } = require('../database.js');
const path = require('path');

// Abre a página do CRUD de formas de pagamento
exports.abrirCrudFormadepagamento = (req, res) => {
  console.log('formadepagamentoController - Rota /abrirCrudFormadepagamento');
  res.sendFile(path.join(__dirname, '../../frontend/formadepagamento/formadepagamento.html'));
};

// Listar todos os registros
exports.listarFormadepagamentos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM formadepagamento ORDER BY idformapagamento');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar formas de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo registro
exports.criarFormadepagamento = async (req, res) => {
  try {
    const { nomeformapagamento } = req.body;

    if (!nomeformapagamento) {
      return res.status(400).json({ error: 'O nome da forma de pagamento é obrigatório' });
    }

    const result = await query(
      'INSERT INTO formadepagamento (nomeformapagamento) VALUES ($1) RETURNING *',
      [nomeformapagamento]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar forma de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter por ID
exports.obterFormadepagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const result = await query('SELECT * FROM formadepagamento WHERE idformapagamento = $1', [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Forma de pagamento não encontrada' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter forma de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar por ID
exports.atualizarFormadepagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nomeformapagamento } = req.body;

    const existente = await query('SELECT * FROM formadepagamento WHERE idformapagamento = $1', [id]);
    if (existente.rows.length === 0)
      return res.status(404).json({ error: 'Forma de pagamento não encontrada' });

    const atualizado = await query(
      'UPDATE formadepagamento SET nomeformapagamento = $1 WHERE idformapagamento = $2 RETURNING *',
      [nomeformapagamento || existente.rows[0].nomeformapagamento, id]
    );

    res.json(atualizado.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar forma de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar por ID
exports.deletarFormadepagamento = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existente = await query('SELECT * FROM formadepagamento WHERE idformapagamento = $1', [id]);
    if (existente.rows.length === 0)
      return res.status(404).json({ error: 'Forma de pagamento não encontrada' });

    await query('DELETE FROM formadepagamento WHERE idformapagamento = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar forma de pagamento:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar a forma de pagamento porque está vinculada a algum pedido'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
