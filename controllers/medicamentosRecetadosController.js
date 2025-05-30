const { query } = require('../config/db.sql');

// Crear medicamento recetado
exports.agregarMedicamento = async (req, res) => {
  try {
    const { receta_id, medicamento_id, dosis, frecuencia, duración } = req.body;

    await query(
      `INSERT INTO MedicamentosRecetados (receta_id, medicamento_id, dosis, frecuencia, duración)
       VALUES (?, ?, ?, ?, ?)`,
      [receta_id, medicamento_id, dosis, frecuencia, duración]
    );

    res.status(201).json({ success: true, mensaje: 'Medicamento recetado agregado correctamente' });
  } catch (error) {
    console.error('Error al agregar medicamento:', error);
    res.status(500).json({ error: 'Error al agregar medicamento recetado' });
  }
};

// Obtener medicamentos por receta
exports.obtenerPorReceta = async (req, res) => {
  try {
    const recetaId = req.params.id;

    const [rows] = await query(
      `SELECT mr.*, p.nombre AS nombre_medicamento, p.fórmula_sal
       FROM MedicamentosRecetados mr
       INNER JOIN Productos p ON mr.medicamento_id = p.id
       WHERE mr.receta_id = ?`,
      [recetaId]
    );

    res.json({ success: true, medicamentos: rows });
  } catch (error) {
    console.error('Error al obtener medicamentos:', error);
    res.status(500).json({ error: 'Error al obtener medicamentos recetados' });
  }
};

// Actualizar medicamento recetado
exports.actualizarMedicamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { dosis, frecuencia, duración } = req.body;

    await query(
      `UPDATE MedicamentosRecetados 
       SET dosis = ?, frecuencia = ?, duración = ? 
       WHERE id = ?`,
      [dosis, frecuencia, duración, id]
    );

    res.json({ success: true, mensaje: 'Medicamento actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar medicamento:', error);
    res.status(500).json({ error: 'Error al actualizar medicamento' });
  }
};

// Eliminar medicamento recetado
exports.eliminarMedicamento = async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM MedicamentosRecetados WHERE id = ?', [id]);

    res.json({ success: true, mensaje: 'Medicamento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar medicamento:', error);
    res.status(500).json({ error: 'Error al eliminar medicamento' });
  }
};
