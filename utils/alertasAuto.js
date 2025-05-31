const { query } = require('../config/db.sql');

exports.generarAlertasAutomaticas = async () => {
  try {
    const doctorId = 1; 
    // STOCK bajo
    const [productosBajos] = await query(`SELECT * FROM Productos WHERE stock <= 3`);
    for (const prod of productosBajos) {
      await query(
        `INSERT INTO Alertas (tipo, destinatario_id, mensaje)
         SELECT 'stock', ?, ? FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM Alertas 
           WHERE tipo = 'stock' AND mensaje LIKE ? AND leída = 0
         )`,
        [doctorId, `El producto "${prod.nombre}" tiene stock bajo (${prod.stock}).`, `%${prod.nombre}%`]
      );
    }

    // CADUCIDAD próxima
    const [productosCaducos] = await query(
      `SELECT * FROM Productos WHERE caducidad IS NOT NULL AND caducidad <= DATE_ADD(NOW(), INTERVAL 7 DAY)`
    );
    for (const prod of productosCaducos) {
      await query(
        `INSERT INTO Alertas (tipo, destinatario_id, mensaje)
         SELECT 'caducidad', ?, ? FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM Alertas 
           WHERE tipo = 'caducidad' AND mensaje LIKE ? AND leída = 0
         )`,
        [doctorId, `El producto "${prod.nombre}" caduca pronto (${prod.caducidad})`, `%${prod.nombre}%`]
      );
    }

    console.log('Alertas automáticas generadas');
  } catch (err) {
    console.error(' Error generando alertas automáticas:', err);
  }
};
