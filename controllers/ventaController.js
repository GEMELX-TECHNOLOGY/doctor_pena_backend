const { query } = require('../config/db.sql');

exports.crearVenta = async (req, res) => {
  try {
    const { paciente_id, producto_id, receta_id = null, cantidad } = req.body;

    // Obtener datos del producto
    const [productoData] = await query('SELECT precio, stock FROM Productos WHERE id = ?', [producto_id]);
    if (productoData.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    const producto = productoData[0];
    if (producto.stock < cantidad) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const total = parseFloat(producto.precio) * cantidad;

    // Registrar venta
    await query(
      `INSERT INTO Ventas (paciente_id, producto_id, receta_id, cantidad, precio_unitario, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paciente_id, producto_id, receta_id, cantidad, producto.precio, total]
    );

    // Restar stock
    await query(`UPDATE Productos SET stock = stock - ? WHERE id = ?`, [cantidad, producto_id]);

    res.status(201).json({ success: true, mensaje: 'Venta registrada correctamente' });
  } catch (error) {
    console.error('Error al registrar venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
// Obtener todas las ventas
exports.obtenerVentas = async (req, res) => {
  try {
    const ventas = await query(`
      SELECT V.*, P.nombre AS producto, Pa.nombre AS paciente
      FROM Ventas V
      JOIN Productos P ON V.producto_id = P.id
      JOIN Pacientes Pa ON V.paciente_id = Pa.id
    `);
    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

// Obtener venta por ID
exports.obtenerVentaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [venta] = await query('SELECT * FROM Ventas WHERE id = ?', [id]);
    if (venta.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(venta[0]);
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
};

// Actualizar venta
exports.actualizarVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    const [ventaExistente] = await query('SELECT * FROM Ventas WHERE id = ?', [id]);
    if (ventaExistente.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });

    const venta = ventaExistente[0];
    const diferenciaCantidad = cantidad - venta.cantidad;

    // Verificar stock disponible si se aumenta la cantidad
    if (diferenciaCantidad > 0) {
      const [productoData] = await query('SELECT stock FROM Productos WHERE id = ?', [venta.producto_id]);
      const producto = productoData[0];
      if (producto.stock < diferenciaCantidad) {
        return res.status(400).json({ error: 'Stock insuficiente para la actualización' });
      }
      await query('UPDATE Productos SET stock = stock - ? WHERE id = ?', [diferenciaCantidad, venta.producto_id]);
    } else if (diferenciaCantidad < 0) {
      await query('UPDATE Productos SET stock = stock + ? WHERE id = ?', [-diferenciaCantidad, venta.producto_id]);
    }

    const nuevoTotal = venta.precio_unitario * cantidad;

    await query(
      `UPDATE Ventas SET cantidad = ?, total = ? WHERE id = ?`,
      [cantidad, nuevoTotal, id]
    );

    res.json({ success: true, mensaje: 'Venta actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar venta
exports.eliminarVenta = async (req, res) => {
  try {
    const { id } = req.params;

    const [ventaExistente] = await query('SELECT * FROM Ventas WHERE id = ?', [id]);
    if (ventaExistente.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });

    const venta = ventaExistente[0];

    // Devolver el stock
    await query('UPDATE Productos SET stock = stock + ? WHERE id = ?', [venta.cantidad, venta.producto_id]);

    await query('DELETE FROM Ventas WHERE id = ?', [id]);

    res.json({ success: true, mensaje: 'Venta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
