const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function getConnection() {
  return await pool.getConnection();
}


async function connectMySQL() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado a MySQL');
    connection.release();
  } catch (error) {
    console.error('Error al conectar a MySQL:', error);
    throw error;
  }
}

module.exports = {
  query: async (sql, params) => {
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  getConnection,
  connectMySQL
};
