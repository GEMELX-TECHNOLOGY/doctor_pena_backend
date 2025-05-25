const { query } = require('../config/db.sql');

// Verifica si ya existe una cita con ese médico a la misma fecha y hora
async function hayConflictoCita(medico_id, fecha_hora, excluirId = null) {
  let sql = `SELECT id FROM Citas WHERE médico_id = ? AND fecha_hora = ?`;
  const params = [medico_id, fecha_hora];
  if (excluirId) {
    sql += ` AND id != ?`;
    params.push(excluirId);
  }
  const [rows] = await query(sql, params);
  return rows.length > 0;
}

async function existePaciente(id) {
  const [res] = await query('SELECT id FROM Pacientes WHERE id = ?', [id]);
  return res.length > 0;
}

async function existeMedico(id) {
  const [res] = await query('SELECT id FROM Medicos WHERE id = ?', [id]);
  return res.length > 0;
}

exports.crearCita = async (req, res) => {
  try {
    const { paciente_id, médico_id, fecha_hora, motivo, estado = 'pendiente', notas } = req.body;

    if (!(await existePaciente(paciente_id))) {
      return res.status(400).json({ error: 'Paciente no encontrado' });
    }

    if (!(await existeMedico(médico_id))) {
      return res.status(400).json({ error: 'Médico no encontrado' });
    }

    if (await hayConflictoCita(médico_id, fecha_hora)) {
      return res.status(409).json({ error: 'Ya existe una cita para ese médico en esa fecha y hora' });
    }

    await query(
      `INSERT INTO Citas (paciente_id, médico_id, fecha_hora, motivo, estado, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paciente_id, médico_id, fecha_hora, motivo, estado, notas]
    );

    res.status(201).json({ success: true, mensaje: 'Cita creada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la cita' });
  }
};

exports.verCitasPorMedico = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT * FROM Citas WHERE médico_id = ? ORDER BY fecha_hora ASC`,
      [req.params.id]
    );
    res.json({ success: true, citas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener citas del médico' });
  }
};

exports.verCitasPorPaciente = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT * FROM Citas WHERE paciente_id = ? ORDER BY fecha_hora ASC`,
      [req.params.id]
    );
    res.json({ success: true, citas: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener citas del paciente' });
  }
};

exports.actualizarCita = async (req, res) => {
  try {
    const { fecha_hora, motivo, estado, notas } = req.body;

    // Validación de solapamiento (si cambia fecha)
    const [citaActual] = await query('SELECT * FROM Citas WHERE id = ?', [req.params.id]);
    if (citaActual.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = citaActual[0];

    if (fecha_hora && fecha_hora !== cita.fecha_hora) {
      const conflicto = await hayConflictoCita(cita.médico_id, fecha_hora, cita.id);
      if (conflicto) {
        return res.status(409).json({ error: 'Ese horario ya está ocupado para este médico' });
      }
    }

    await query(
      `UPDATE Citas SET fecha_hora = ?, motivo = ?, estado = ?, notas = ? WHERE id = ?`,
      [
        fecha_hora || cita.fecha_hora,
        motivo || cita.motivo,
        estado || cita.estado,
        notas || cita.notas,
        req.params.id
      ]
    );

    res.json({ success: true, mensaje: 'Cita actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
};

exports.cancelarCita = async (req, res) => {
  try {
    const [result] = await query(
      `UPDATE Citas SET estado = 'cancelada' WHERE id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    res.json({ success: true, mensaje: 'Cita cancelada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cancelar cita' });
  }
};
