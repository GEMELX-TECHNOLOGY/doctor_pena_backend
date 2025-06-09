const { query } = require('../config/db.sql');

const USUARIO_ID_DOCTOR_ADMIN = 1; // ID del Doctor 

// Verifica si ya existe una cita en esa fecha y hora
async function hayConflictoCita(fecha_hora, excluirId = null) {
  let sql = `SELECT id FROM Citas WHERE fecha_hora = ?`;
  const params = [fecha_hora];
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

exports.crearCita = async (req, res) => {
  try {
    const { paciente_id, fecha_hora, motivo, estado = 'pendiente', notas } = req.body;

    if (!(await existePaciente(paciente_id))) {
      return res.status(400).json({ error: 'Paciente no encontrado' });
    }

    if (await hayConflictoCita(fecha_hora)) {
      return res.status(409).json({ error: 'Ya existe una cita en esa fecha y hora' });
    }

    await query(
      `INSERT INTO Citas (paciente_id, fecha_hora, motivo, estado, notas)
       VALUES (?, ?, ?, ?, ?)`,
      [paciente_id, fecha_hora, motivo, estado, notas]
    );

    const [pacienteData] = await query(`SELECT nombre, apellidos FROM Pacientes WHERE id = ?`, [paciente_id]);
    const nombrePaciente = pacienteData.length > 0 ? `${pacienteData[0].nombre} ${pacienteData[0].apellidos}` : 'Paciente';

    await query(`INSERT INTO Alertas (tipo, destinatario_id, mensaje) VALUES ('cita', ?, ?)`, [
      paciente_id,
      `Tienes una cita el ${fecha_hora}`
    ]);

    await query(`INSERT INTO Alertas (tipo, destinatario_id, mensaje) VALUES ('cita', ?, ?)`, [
      USUARIO_ID_DOCTOR_ADMIN,
      `Tienes una cita con el paciente ${nombrePaciente} el ${fecha_hora}`
    ]);

    res.status(201).json({ success: true, mensaje: 'Cita creada y alertas generadas' });

  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ error: 'Error al crear cita' });
  }
};

exports.actualizarCita = async (req, res) => {
  try {
    const { fecha_hora, motivo, estado, notas } = req.body;

    const [citaActual] = await query('SELECT * FROM Citas WHERE id = ?', [req.params.id]);
    if (citaActual.length === 0)
      return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = citaActual[0];
    let nuevoEstado = estado || cita.estado;

    // Si cambia la fecha, validamos conflicto y marcamos como reprogramada
    if (fecha_hora && fecha_hora !== cita.fecha_hora) {
      const conflicto = await hayConflictoCita(fecha_hora, cita.id);
      if (conflicto) {
        return res.status(409).json({ error: 'Ese horario ya está ocupado' });
      }
      nuevoEstado = 'reprogramada'; // Marcar como reprogramada automáticamente
    }

    await query(
      `UPDATE Citas SET fecha_hora = ?, motivo = ?, estado = ?, notas = ? WHERE id = ?`,
      [
        fecha_hora || cita.fecha_hora,
        motivo || cita.motivo,
        nuevoEstado,
        notas || cita.notas,
        req.params.id
      ]
    );

    const [pacienteData] = await query(`SELECT nombre, apellidos, usuario_id FROM Pacientes WHERE id = ?`, [cita.paciente_id]);
    const nombrePaciente = pacienteData.length > 0 ? `${pacienteData[0].nombre} ${pacienteData[0].apellidos}` : 'Paciente';
    const usuarioIdPaciente = pacienteData[0]?.usuario_id;
    const nuevaFecha = fecha_hora || cita.fecha_hora;

    // Alertas
    if (usuarioIdPaciente) {
      await query(`INSERT INTO Alertas (tipo, destinatario_id, mensaje) VALUES ('cita', ?, ?)`, [
        usuarioIdPaciente,
        `Tu cita ha sido ${nuevoEstado === 'reprogramada' ? 'reprogramada' : 'actualizada'}: ${nuevaFecha}`
      ]);
    }

    await query(`INSERT INTO Alertas (tipo, destinatario_id, mensaje) VALUES ('cita', ?, ?)`, [
      USUARIO_ID_DOCTOR_ADMIN,
      `Cita ${nuevoEstado === 'reprogramada' ? 'reprogramada' : 'actualizada'} con ${nombrePaciente} para el ${nuevaFecha}`
    ]);

    res.json({ success: true, mensaje: `Cita ${nuevoEstado} y alertas enviadas correctamente` });

  } catch (err) {
    console.error('Error al actualizar cita:', err);
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

exports.marcarCitaCompletada = async (req, res) => {
  try {
    const [result] = await query(
      `UPDATE Citas SET estado = 'completada' WHERE id = ?`,
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    res.json({ success: true, mensaje: 'Cita marcada como completada' });
  } catch (err) {
    console.error('Error al marcar cita como completada:', err);
    res.status(500).json({ error: 'Error al actualizar cita' });
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

exports.verTodasLasCitas = async (req, res) => {
  try {
    const [rows] = await query(`SELECT * FROM Citas ORDER BY fecha_hora ASC`);
    res.json({ success: true, citas: rows });
  } catch (err) {
    console.error('Error al obtener todas las citas:', err);
    res.status(500).json({ error: 'Error al obtener todas las citas' });
  }
};
