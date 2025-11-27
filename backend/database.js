const { Pool } = require('pg');

// Configuração da conexão com o banco de dados PostgreSQL
const dbConfig = {
  host: 'localhost',
  port: 5432,
  user: 'radames',
  password: 'Lageado001.',
  database: 'malisa-zeniteStore',

  ssl: false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const schema = 'public'; // Schema padrão (SEU SCHEMA)

// Pool de conexões
const pool = new Pool({
  ...dbConfig,
  max: 10,
  min: 0,
  idle: 10000,
  acquire: 30000,
  evict: 1000
});

// Tratamento de erros do pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// Função para testar conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conectado ao PostgreSQL com sucesso!');

    await client.query('SET search_path TO public');

    client.release();
    return true;
  } catch (err) {
    console.error('Erro ao conectar com o PostgreSQL:', err);
    return false;
  }
};

// Função para executar queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO public');
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Função para transações
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET search_path TO public');

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na transação:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
