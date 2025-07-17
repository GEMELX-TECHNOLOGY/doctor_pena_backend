const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

function createPool() {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

const connectMySQL = async () => {
  try {
    if (!pool) createPool();

    const connection = await pool.getConnection();
    console.log("✅ MySQL connected");
    connection.release();

    setInterval(async () => {
      try {
        const conn = await pool.getConnection();
        await conn.ping();
        conn.release();
      } catch (pingErr) {
        console.error("❌ MySQL ping failed, recreating pool:", pingErr);
        createPool();
      }
    }, 60000);
  } catch (error) {
    console.error("❌ MySQL connection failed:", error);
    throw error;
  }
};

const query = async (...params) => {
  if (!pool) {
    throw new Error("Pool is not initialized. Call connectMySQL first.");
  }
  return pool.query(...params);
};

module.exports = {
  connectMySQL,
  query,
};
