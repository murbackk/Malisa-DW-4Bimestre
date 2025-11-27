const db = require('../database.js');
const path = require('path');

// ==================== ABRIR PÁGINA HTML (opcional) ====================
exports.abrirPaginaPagamento = (req, res) => {
  const caminho = path.join(__dirname, '../frontend/pagamento.html');
  res.sendFile(caminho);
};

// ==================== CRIAR PAGAMENTO ====================
// Rota chamada quando o usuário clicar em "Pagamento realizado"
exports.registrarPagamento = async (req, res) => {
  try {
    const { idPedido, valorPago, idFormaPagamento } = req.body;

    if (!idPedido || !valorPago || !idFormaPagamento) {
      return res.status(400).json({
        status: 'erro',
        mensagem: 'Campos obrigatórios ausentes (idPedido, valorPago, idFormaPagamento)',
      });
    }

    const sql = `
      INSERT INTO Pagamento (idPedido, valorPago, idFormaPagamento)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const result = await db.query(sql, [idPedido, valorPago, idFormaPagamento]);

    res.status(201).json({
      status: 'ok',
      mensagem: 'Pagamento registrado com sucesso',
      pagamento: result.rows[0],
    });

  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(500).json({
      status: 'erro',
      mensagem: 'Erro interno ao registrar pagamento',
      detalhe: error.message,
    });
  }
};

// ==================== LISTAR PAGAMENTOS ====================
exports.listarPagamentos = async (req, res) => {
  try {
    const sql = `
      SELECT p.idPedido, p.dataPagamento, p.valorPago, f.nomeFormaPagamento
      FROM Pagamento p
      LEFT JOIN FormaDePagamento f ON p.idFormaPagamento = f.idFormaPagamento
      ORDER BY p.dataPagamento DESC;
    `;

    const result = await db.query(sql);
    res.json(result.rows);

  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({
      status: 'erro',
      mensagem: 'Erro interno ao listar pagamentos',
      detalhe: error.message,
    });
  }
};
