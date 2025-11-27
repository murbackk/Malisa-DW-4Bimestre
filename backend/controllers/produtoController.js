const { query, transaction } = require('../database');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configuração do Multer para upload de imagem temporária
const upload = multer({ dest: 'uploads/' });

// Middleware de upload 
exports.uploadImagem = upload.single('imagem');

// Abre a página do CRUD de produtos
exports.abrirCrudproduto = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/produto/produto.html'));
};

// ==================== LISTAR TODOS OS PRODUTOS (GET /produto) ====================
exports.listarprodutos = async (req, res) => {
  try {
    const querySQL = `
      SELECT p.idproduto, p.nomeproduto, p.precounitario, p.descricao, p.idcategoria, 
             c.nomecategoria,
             CASE WHEN i.idimagem IS NOT NULL THEN TRUE ELSE FALSE END AS possuiimagem
      FROM produto p
      LEFT JOIN categoria c ON p.idcategoria = c.idcategoria
      LEFT JOIN imagemproduto i ON p.idproduto = i.idproduto
      ORDER BY p.idproduto
    `;
    const result = await req.db.query(querySQL);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==================== CRIAR NOVO PRODUTO (POST /produto) ====================
exports.criarproduto = async (req, res) => {
  const { nomeproduto, precounitario, descricao, idcategoria } = req.body;
  const imagemFile = req.file;

  if (!nomeproduto || !precounitario) {
    // Se o multer rodou, deleta o arquivo temporário
    if (imagemFile) fs.unlinkSync(imagemFile.path);
    return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
  }

  try {
    const result = await transaction(async (client) => {
        // 1. Inserir na tabela PRODUTO
        const produtoQuery = `
          INSERT INTO produto (nomeproduto, precounitario, descricao, idcategoria)
          VALUES ($1, $2, $3, $4) RETURNING idproduto
        `;
        const produtoResult = await client.query(produtoQuery, [
          nomeproduto,
          precounitario,
          descricao || null,
          idcategoria || null,
        ]);
        const idproduto = produtoResult.rows[0].idproduto;

        // 2. Inserir na tabela IMAGEMPRODUTO (se houver arquivo)
        if (imagemFile) {
            const imagemBuffer = fs.readFileSync(imagemFile.path);
            const imagemQuery = 'INSERT INTO imagemproduto (idproduto, imagem) VALUES ($1, $2) RETURNING idimagem';
            await client.query(imagemQuery, [idproduto, imagemBuffer]);
            fs.unlinkSync(imagemFile.path); // Deleta o arquivo temporário
        }
        
        return { idproduto, nomeproduto, precounitario };
    });

    res.status(201).json({ 
        status: 'ok', 
        mensagem: 'produto criado com sucesso!', 
        produto: result 
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    // Garante que o arquivo temporário seja removido em caso de erro
    if (imagemFile) fs.unlinkSync(imagemFile.path); 
    res.status(500).json({ error: 'Erro interno do servidor ao criar produto.' });
  }
};

// ==================== OBTER PRODUTO (GET /produto/:idproduto) ====================
exports.obterproduto = async (req, res) => {
  const idproduto = req.params.idproduto;
  try {
    const querySQL = `
      SELECT p.idproduto, p.nomeproduto, p.precounitario, p.descricao, p.idcategoria, 
             c.nomecategoria
      FROM produto p
      LEFT JOIN categoria c ON p.idcategoria = c.idcategoria
      WHERE p.idproduto = $1
    `;
    const result = await req.db.query(querySQL, [idproduto]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'produto não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==================== OBTER IMAGEM DO PRODUTO (GET /produto/:idproduto/imagem) ====================
exports.obterImagemproduto = async (req, res) => {
    const idproduto = req.params.idproduto;
    try {
        const querySQL = 'SELECT imagem FROM imagemproduto WHERE idproduto = $1';
        const result = await req.db.query(querySQL, [idproduto]);
        
        if (result.rows.length === 0 || !result.rows[0].imagem) {
            return res.status(404).send('Imagem não encontrada');
        }

        const imagemBuffer = result.rows[0].imagem;
        res.set('Content-Type', 'image/jpeg'); // Assumindo jpeg, ajuste se necessário
        res.send(imagemBuffer);
    } catch (error) {
        console.error('Erro ao obter imagem do produto:', error);
        res.status(500).send('Erro interno do servidor ao obter imagem');
    }
};

// ==================== ATUALIZAR PRODUTO (PUT /produto/:idproduto) ====================
exports.atualizarproduto = async (req, res) => {
  const idproduto = req.params.idproduto;
  const { nomeproduto, precounitario, descricao, idcategoria } = req.body;
  const imagemFile = req.file;

  try {
    const existing = await req.db.query('SELECT * FROM produto WHERE idproduto = $1', [idproduto]);
    if (existing.rows.length === 0) {
      if (imagemFile) fs.unlinkSync(imagemFile.path);
      return res.status(404).json({ error: 'produto não encontrado' });
    }

    const updated = await transaction(async (client) => {
        // 1. Atualizar na tabela PRODUTO
        const produtoQuery = `
          UPDATE produto
          SET nomeproduto = $1, precounitario = $2, descricao = $3, idcategoria = $4
          WHERE idproduto = $5
          RETURNING *
        `;
        const produtoResult = await client.query(produtoQuery, [
            nomeproduto || existing.rows[0].nomeproduto,
            precounitario || existing.rows[0].precounitario,
            descricao !== undefined ? descricao : existing.rows[0].descricao,
            idcategoria || existing.rows[0].idcategoria,
            idproduto
        ]);

        // 2. Atualizar/Inserir na tabela IMAGEMPRODUTO (se houver novo arquivo)
        if (imagemFile) {
            const imagemBuffer = fs.readFileSync(imagemFile.path);
            const existingImage = await client.query('SELECT idimagem FROM imagemproduto WHERE idproduto = $1', [idproduto]);

            if (existingImage.rows.length > 0) {
                await client.query('UPDATE imagemproduto SET imagem = $1 WHERE idproduto = $2', [imagemBuffer, idproduto]);
            } else {
                await client.query('INSERT INTO imagemproduto (idproduto, imagem) VALUES ($1, $2)', [idproduto, imagemBuffer]);
            }
            
            fs.unlinkSync(imagemFile.path);
        }

        return produtoResult.rows[0];
    });

    res.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    if (imagemFile) fs.unlinkSync(imagemFile.path);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==================== DELETAR PRODUTO (DELETE /produto/:idproduto) ====================
exports.deletarproduto = async (req, res) => {
  const idproduto = req.params.idproduto;
  try {
    // O delete na tabela 'produto' deve ser em cascata para 'imagemproduto' e 'pedidoproduto'
    const querySQL = 'DELETE FROM produto WHERE idproduto = $1 RETURNING idproduto';
    const result = await req.db.query(querySQL, [idproduto]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'produto não encontrado' });
    }
    res.status(200).json({ status: 'ok', mensagem: 'produto deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};