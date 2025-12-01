const db = require('../database.js');

// Verifica se o usuário está logado
exports.verificaSeUsuarioEstaLogado = (req, res) => {
  console.log('loginController - Acessando rota /verificaSeUsuarioEstaLogado');
  const nome = req.cookies.usuarioLogado;
  console.log('Cookie usuarioLogado:', nome);

  if (nome) {
    res.json({ status: 'ok', nome });
  } else {
    res.json({ status: 'nao_logado' });
  }
};

// Verifica se o email existe
exports.verificarEmail = async (req, res) => {
  const { email } = req.body;

  const sql = 'SELECT nomeUsuario FROM Usuario WHERE email = $1';
  console.log('rota verificarEmail:', sql, email);

  try {
    const result = await db.query(sql, [email]);

    if (result.rows.length > 0) {
      return res.json({ status: 'existe', nome: result.rows[0].nomeusuario });
    }

    res.json({ status: 'nao_encontrado' });
  } catch (err) {
    console.error('Erro em verificarEmail:', err);
    res.status(500).json({ status: 'erro', mensagem: err.message });
  }
};

// Verifica a senha
exports.verificarSenha = async (req, res) => {
  const { email, senha } = req.body;

  const sql = `
    SELECT idUsuario, nomeUsuario 
    FROM Usuario 
    WHERE email = $1 AND senha = $2
  `;

  console.log('Rota verificarSenha:', sql, email, senha);

  try {
    const result = await db.query(sql, [email, senha]);

    if (result.rows.length === 0) {
      return res.json({ status: 'senha_incorreta' });
    }

    const { idusuario, nomeusuario } = result.rows[0];

    res.cookie('usuarioLogado', nomeusuario, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("Cookie 'usuarioLogado' definido com sucesso");

    return res.json({
      status: 'ok',
      nome: nomeusuario,
      id: idusuario,
    });

  } catch (err) {
    console.error('Erro ao verificar senha:', err);
    return res.status(500).json({ status: 'erro', mensagem: err.message });
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie('usuarioLogado', {
    sameSite: 'None',
    secure: true,
    httpOnly: true,
    path: '/',
  });
  console.log("Cookie 'usuarioLogado' removido com sucesso");
  res.json({ status: 'deslogado' });
};

exports.verificarGerente = async (req, res) => {
    const idusuario = req.query.idusuario;

    if (!idusuario) {
        return res.status(400).json({ erro: "idusuario não informado" });
    }

    try {
        const result = await req.db.query(
            `
            SELECT f.idcargo
            FROM funcionario f
            WHERE f.idusuario = $1
            `,
            [idusuario]
        );

        if (result.rows.length === 0) {
            // Usuário não está na tabela funcionario
            return res.json({ isGerente: false });
        }

        const idcargo = result.rows[0].idcargo;

        // Gerente = idcargo 1
        const isGerente = idcargo == 1;

        return res.json({ isGerente });

    } catch (error) {
        console.error("Erro em verificarGerente:", error);
        return res.status(500).json({ erro: "Erro interno no servidor" });
    }
};

exports.getClienteByUsuario = async (req, res) => {
    const { idusuario } = req.params;

    try {
        const result = await req.db.query(
            "SELECT idcliente FROM cliente WHERE idusuario = $1",
            [idusuario]
        );

        if (result.rows.length === 0) {
            return res.json({ idCliente: null });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar cliente" });
    }
};


