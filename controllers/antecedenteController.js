const { query } = require('../config/db.sql');

// Crear antecedente familiar
exports.crearAntecedente = async (req, res) => {
  try {
    const { paciente_id, enfermedad, familiar, notas } = req.body;

    await query(
      `INSERT INTO AntecedentesFamiliares (paciente_id, enfermedad, familiar, notas)
       VALUES (?, ?, ?, ?)`,
      [paciente_id, enfermedad, familiar, notas]
    );

    res.status(201).json({ success: true, mensaje: 'Antecedente familiar registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar antecedente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener antecedentes por paciente
exports.obtenerAntecedentesPorPaciente = async (req, res) => {
  try {
    const pacienteId = req.params.id;
    const [rows] = await query(
      'SELECT * FROM AntecedentesFamiliares WHERE paciente_id = ?',
      [pacienteId]
    );
    res.json({ success: true, antecedentes: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener antecedentes' });
  }
};

// Actualizar antecedente
exports.actualizarAntecedente = async (req, res) => {
  try {
    const antecedenteId = req.params.id;
    const { enfermedad, familiar, notas } = req.body;

    const [result] = await query(
      `UPDATE AntecedentesFamiliares SET enfermedad = ?, familiar = ?, notas = ? WHERE id = ?`,
      [enfermedad, familiar, notas, antecedenteId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Antecedente no encontrado' });
    }

    res.json({ success: true, mensaje: 'Antecedente actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar antecedente' });
  }
};

// Eliminar antecedente
exports.eliminarAntecedente = async (req, res) => {
  try {
    const antecedenteId = req.params.id;

    const [result] = await query(
      'DELETE FROM AntecedentesFamiliares WHERE id = ?',
      [antecedenteId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Antecedente no encontrado' });
    }

    res.json({ success: true, mensaje: 'Antecedente eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar antecedente' });
  }
};
