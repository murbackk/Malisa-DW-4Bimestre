const { query } = require('../database.js');
const path = require('path');

// Abre a página do CRUD de funcionários
exports.abrirCrudFuncionario = (req, res) => {
  console.log('funcionarioController - Rota /abrirCrudFuncionario - abrir o crudFuncionario');
  res.sendFile(path.join(__dirname, '../../frontend/funcionario/funcionario.html'));
};

// Listar todos os funcionários
exports.listarFuncionarios = async (req, res) => {
  try {
    const result = await query(`
      SELECT f.idfuncionario, f.nomefuncionario, 
             c.nomecargo, u.nomeusuario
      FROM funcionario f
      LEFT JOIN cargos c ON f.idcargo = c.idcargo
      LEFT JOIN usuario u ON f.idusuario = u.idusuario
      ORDER BY f.idfuncionario
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo funcionário
exports.criarFuncionario = async (req, res) => {
  try {
    console.log('=== CRIAR FUNCIONÁRIO - DADOS RECEBIDOS ===');
    console.log('Body completo:', req.body);
    
    // Aceita tanto camelCase (frontend) quanto lowercase (padrão PostgreSQL)
    const nomefuncionario = req.body.nomeFuncionario || req.body.nomefuncionario;
    const idcargo = req.body.idCargo || req.body.idcargo;
    const idusuario = req.body.idUsuario || req.body.idusuario;

    console.log('Campos extraídos:');
    console.log('- nomefuncionario:', nomefuncionario);
    console.log('- idcargo:', idcargo);
    console.log('- idusuario:', idusuario);

    if (!nomefuncionario) {
      console.log('❌ Nome do funcionário não foi fornecido');
      return res.status(400).json({ 
        status: 'erro',
        error: 'Nome do funcionário é obrigatório' 
      });
    }

    if (!idusuario) {
      console.log('❌ ID do usuário não foi fornecido');
      return res.status(400).json({ 
        status: 'erro',
        error: 'ID do usuário é obrigatório' 
      });
    }

    // Verificar se o usuário existe
    console.log('Verificando se usuário existe:', idusuario);
    const usuarioExiste = await query(
      'SELECT idusuario FROM usuario WHERE idusuario = $1',
      [idusuario]
    );

    if (usuarioExiste.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', idusuario);
      return res.status(400).json({ 
        status: 'erro',
        error: 'Usuário não encontrado' 
      });
    }
    console.log('✅ Usuário existe');

    // Verificar se o cargo existe (se foi informado)
    if (idcargo) {
      console.log('Verificando se cargo existe:', idcargo);
      const cargoExiste = await query(
        'SELECT idcargo FROM cargos WHERE idcargo = $1',
        [idcargo]
      );

      if (cargoExiste.rows.length === 0) {
        console.log('❌ Cargo não encontrado:', idcargo);
        return res.status(400).json({ 
          status: 'erro',
          error: 'Cargo não encontrado' 
        });
      }
      console.log('✅ Cargo existe');
    }

    // Inserir funcionário
    console.log('Inserindo funcionário no banco...');
    const result = await query(
      `INSERT INTO funcionario (nomefuncionario, idcargo, idusuario)
       VALUES ($1, $2, $3) RETURNING *`,
      [nomefuncionario, idcargo || null, idusuario]
    );

    console.log('✅ Funcionário criado com sucesso:', result.rows[0]);

    res.status(201).json({
      status: 'ok',
      mensagem: 'Funcionário cadastrado com sucesso',
      funcionario: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao criar funcionário:', error);

    if (error.code === '23505') {
      // violação de UNIQUE (idUsuario já vinculado)
      return res.status(400).json({ 
        status: 'erro',
        error: 'Usuário já vinculado a outro funcionário' 
      });
    }

    res.status(500).json({ 
      status: 'erro',
      error: 'Erro interno do servidor',
      mensagem: error.message
    });
  }
};

// Obter funcionário por ID
exports.obterFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(`
      SELECT f.*, c.nomecargo, u.nomeusuario
      FROM funcionario f
      LEFT JOIN cargos c ON f.idcargo = c.idcargo
      LEFT JOIN usuario u ON f.idusuario = u.idusuario
      WHERE f.idfuncionario = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar funcionário
exports.atualizarFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nomefuncionario, idcargo, idusuario } = req.body;

    const existing = await query('SELECT * FROM funcionario WHERE idfuncionario = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    const updated = await query(
      `UPDATE funcionario 
       SET nomefuncionario = $1, idcargo = $2, idusuario = $3
       WHERE idfuncionario = $4
       RETURNING *`,
      [
        nomefuncionario || existing.rows[0].nomefuncionario,
        idcargo ?? existing.rows[0].idcargo,
        idusuario ?? existing.rows[0].idusuario,
        id
      ]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar funcionário
exports.deletarFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await query('SELECT * FROM funcionario WHERE idfuncionario = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    await query('DELETE FROM funcionario WHERE idfuncionario = $1', [id]);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};