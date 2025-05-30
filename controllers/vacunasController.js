const { query } = require('../config/db.sql');

// Verifica si el paciente es tipo "bebe" o "nino"
async function esPacienteInfantil(paciente_id) {
  const [rows] = await query('SELECT tipo_paciente FROM Pacientes WHERE id = ?', [paciente_id]);
  if (rows.length === 0) return false;
  return ['bebe', 'nino'].includes(rows[0].tipo_paciente);
}

exports.registrarVacuna = async (req, res) => {
  try {
    const { paciente_id, nombre, fecha_aplicacion, dosis, proxima_dosis, notas } = req.body;

    if (!(await esPacienteInfantil(paciente_id))) {
      return res.status(400).json({ error: 'Solo se pueden registrar vacunas para pacientes tipo bebé o niño' });
    }

    await query(
      `INSERT INTO Vacunas (paciente_id, nombre, fecha_aplicacion, dosis, proxima_dosis, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paciente_id, nombre, fecha_aplicacion, dosis, proxima_dosis, notas]
    );

    res.status(201).json({ success: true, mensaje: 'Vacuna registrada correctamente' });
  } catch (error) {
    console.error('Error al registrar vacuna:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.obtenerVacunasPorPaciente = async (req, res) => {
  try {
    const pacienteId = req.params.id;
    const [rows] = await query('SELECT * FROM Vacunas WHERE paciente_id = ?', [pacienteId]);
    res.json({ success: true, vacunas: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vacunas del paciente' });
  }
};

exports.actualizarVacuna = async (req, res) => {
  try {
    const vacunaId = req.params.id;
    const { nombre, fecha_aplicacion, dosis, proxima_dosis, notas } = req.body;

    const [result] = await query(
      `UPDATE Vacunas SET nombre = ?, fecha_aplicacion = ?, dosis = ?, proxima_dosis = ?, notas = ?
       WHERE id = ?`,
      [nombre, fecha_aplicacion, dosis, proxima_dosis, notas, vacunaId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vacuna no encontrada' });
    }

    res.json({ success: true, mensaje: 'Vacuna actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar vacuna' });
  }
};

exports.eliminarVacuna = async (req, res) => {
  try {
    const vacunaId = req.params.id;
    const [result] = await query('DELETE FROM Vacunas WHERE id = ?', [vacunaId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vacuna no encontrada' });
    }

    res.json({ success: true, mensaje: 'Vacuna eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar vacuna' });
  }
};
  