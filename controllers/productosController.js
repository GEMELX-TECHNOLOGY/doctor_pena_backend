const { query } = require('../config/db.sql');

// Crear producto
exports.crearProducto = async (req, res) => {
  try {
    const {
      código_barras,
      nombre,
      descripción,
      fórmula_sal,
      tipo,
      precio,
      stock,
      stock_mínimo,
      ubicación,
      caducidad,
      proveedor,
      imagen
    } = req.body;

    await query(
      `INSERT INTO Productos 
      (código_barras, nombre, descripción, fórmula_sal, tipo, precio, stock, stock_mínimo, ubicación, caducidad, proveedor, imagen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [código_barras, nombre, descripción, fórmula_sal, tipo, precio, stock, stock_mínimo, ubicación, caducidad, proveedor, imagen]
    );

    res.status(201).json({ success: true, mensaje: 'Producto registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar producto:', error);
    res.status(500).json({ error: 'Error al registrar producto' });
  }
};

// Obtener todos los productos
exports.obtenerTodos = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM Productos ORDER BY nombre ASC');
    res.json({ success: true, productos: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Obtener un producto por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await query('SELECT * FROM Productos WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ success: true, producto: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// Actualizar producto
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const campos = req.body;

    const camposSet = Object.keys(campos).map(key => `${key} = ?`).join(', ');
    const valores = Object.values(campos);

    await query(`UPDATE Productos SET ${camposSet} WHERE id = ?`, [...valores, id]);

    res.json({ success: true, mensaje: 'Producto actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// Eliminar producto
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM Productos WHERE id = ?', [id]);

    res.json({ success: true, mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};
