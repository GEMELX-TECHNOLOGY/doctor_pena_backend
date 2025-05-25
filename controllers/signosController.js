// controllers/signosController.js
const { query } = require('../config/db.sql');

// Validar existencia de la consulta
async function existeConsulta(consulta_id) {
  const [res] = await query('SELECT id FROM Consultas WHERE id = ?', [consulta_id]);
  return res.length > 0;
}

// Crear signos vitales (uno por consulta)
exports.crearSignos = async (req, res) => {
  try {
    const {
      consulta_id,
      temperatura,
      frecuencia_cardíaca,
      oxigenación,
      presión_arterial,
      peso,
      estatura
    } = req.body;

    if (!(await existeConsulta(consulta_id))) {
      return res.status(400).json({ error: 'Consulta no encontrada' });
    }

    // Verificar si ya existen signos para esta consulta
    const [existe] = await query('SELECT id FROM SignosVitales WHERE consulta_id = ?', [consulta_id]);
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Ya existen signos vitales para esta consulta' });
    }

    await query(
      `INSERT INTO SignosVitales 
      (consulta_id, temperatura, frecuencia_cardíaca, oxigenación, presión_arterial, peso, estatura)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [consulta_id, temperatura, frecuencia_cardíaca, oxigenación, presión_arterial, peso, estatura]
    );

    res.status(201).json({ success: true, mensaje: 'Signos vitales registrados correctamente' });
  } catch (err) {
    console.error('Error al registrar signos vitales:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener signos vitales por consulta
exports.verSignosPorConsulta = async (req, res) => {
  try {
    const consulta_id = req.params.consulta_id;
    const [rows] = await query('SELECT * FROM SignosVitales WHERE consulta_id = ?', [consulta_id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron signos para esta consulta' });
    }
    res.json({ success: true, signos: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener signos vitales' });
  }
};

// Actualizar signos vitales
exports.actualizarSignos = async (req, res) => {
  try {
    const consulta_id = req.params.consulta_id;
    const {
      temperatura,
      frecuencia_cardíaca,
      oxigenación,
      presión_arterial,
      peso,
      estatura
    } = req.body;

    const [existe] = await query('SELECT id FROM SignosVitales WHERE consulta_id = ?', [consulta_id]);
    if (existe.length === 0) {
      return res.status(404).json({ error: 'No hay signos vitales registrados para esta consulta' });
    }

    await query(
      `UPDATE SignosVitales SET 
      temperatura = ?, 
      frecuencia_cardíaca = ?, 
      oxigenación = ?, 
      presión_arterial = ?, 
      peso = ?, 
      estatura = ?
      WHERE consulta_id = ?`,
      [temperatura, frecuencia_cardíaca, oxigenación, presión_arterial, peso, estatura, consulta_id]
    );

    res.json({ success: true, mensaje: 'Signos vitales actualizados correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar signos vitales' });
  }
};
