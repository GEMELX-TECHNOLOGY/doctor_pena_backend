const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: "-05:00", // Zona horaria aplicada desde la conexión
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


const query = async (sql, params) => {
  const [results] = await pool.query(sql, params);
  return results;
};


const getConnection = async () => {
  const connection = await pool.getConnection();
  await connection.query("SET time_zone = '-05:00'");
  return connection;
};

module.exports = {
  pool,
  query,
  getConnection,
};
