-- Tabela de usuários (login)
CREATE TABLE usuario (
    idusuario SERIAL PRIMARY KEY,
    nomeusuario VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);

-- Tabela de categorias de produtos
CREATE TABLE categoria (
    idcategoria SERIAL PRIMARY KEY,
    nomecategoria VARCHAR(100) NOT NULL,
    descricao TEXT
);

-- Tabela de produtos
CREATE TABLE produto (
    idproduto SERIAL PRIMARY KEY,
    nomeproduto VARCHAR(100) NOT NULL,
    precounitario NUMERIC(10,2) NOT NULL,
    descricao TEXT,
    idcategoria INT REFERENCES Categoria(idCategoria) ON DELETE SET NULL
);

-- Tabela de imagem (1:1 com produto)
CREATE TABLE imagemproduto (
    idimagem SERIAL PRIMARY KEY,
    idproduto INT UNIQUE REFERENCES Produto(idProduto) ON DELETE CASCADE,
    imagem BYTEA -- arquivo binário
);

-- Tabela de clientes 
CREATE TABLE cliente (
    idcliente SERIAL PRIMARY KEY,
    nomecliente VARCHAR(100),
    email VARCHAR(100)
);

-- Tabela de pedidos
CREATE TABLE pedido (
    idpedido SERIAL PRIMARY KEY,
    idcliente INT REFERENCES Cliente(idCliente) ON DELETE SET NULL,
    idusuario INT REFERENCES Usuario(idUsuario) ON DELETE SET NULL,
    datapedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valortotal NUMERIC(10,2)
);

-- Tabela de relação N:M entre pedidos e produtos
CREATE TABLE pedidoproduto (
    idpedido INT REFERENCES Pedido(idPedido) ON DELETE CASCADE,
    idproduto INT REFERENCES Produto(idProduto) ON DELETE CASCADE,
    quantidade INT NOT NULL,
    precounitario NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (idpedido, idproduto)
);

-- Tabela de formas de pagamento
CREATE TABLE formadepagamento (
    idformapagamento SERIAL PRIMARY KEY,
    nomeformapagamento VARCHAR(100)
);

-- Tabela de pagamentos (1:1 com pedido)
CREATE TABLE pagamento (
    idpedido INT PRIMARY KEY REFERENCES pedido(idpedido) ON DELETE CASCADE,
    datapagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valorpago NUMERIC(10,2),
    idFormapagamento INT REFERENCES formadepagamento(idformapagamento)
);

-- Tabela de cargos
CREATE TABLE cargos (
    idcargo SERIAL PRIMARY KEY,
    nomecargo VARCHAR(100) NOT NULL,
    codigocargo VARCHAR(20) UNIQUE NOT NULL -- código usado para autenticar o cargo e dar acesso ao gerenciamento
);

-- Cargos para testar
INSERT INTO cargos (nomecargo, codigocargo) VALUES
('Gerente', 'GER123'),
('Gerente de Website', 'WEB456'),
('Vendedor', 'VEN789');

-- Tabela de funcionários
CREATE TABLE funcionario (
    idfuncionario SERIAL PRIMARY KEY,
    nomefuncionario VARCHAR(100) NOT NULL,
    idcargo INT REFERENCES cargos(idcargo) ON DELETE SET NULL,
    idusuario INT UNIQUE REFERENCES usuario(idusuario) ON DELETE CASCADE
);