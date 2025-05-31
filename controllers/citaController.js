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

    // Crear cita
    await query(
      `INSERT INTO Citas (paciente_id, médico_id, fecha_hora, motivo, estado, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paciente_id, médico_id, fecha_hora, motivo, estado, notas]
    );

    // Obtener nombre del paciente (para mostrarlo en la alerta del médico)
    const [pacienteData] = await query(`SELECT nombre, apellidos FROM Pacientes WHERE id = ?`, [paciente_id]);
    const nombrePaciente = pacienteData.length > 0 ? `${pacienteData[0].nombre} ${pacienteData[0].apellidos}` : 'Paciente';

    // Crear alerta para paciente
    await query(
      `INSERT INTO Alertas (tipo, destinatario_id, mensaje)
       VALUES ('cita', ?, ?)`,
      [paciente_id, `Tienes una cita el ${fecha_hora}`]
    );

    // Crear alerta para médico
    await query(
      `INSERT INTO Alertas (tipo, destinatario_id, mensaje)
       VALUES ('cita', ?, ?)`,
      [médico_id, `Tienes una cita con el paciente ${nombrePaciente} el ${fecha_hora}`]
    );

    res.status(201).json({ success: true, mensaje: 'Cita creada y alertas generadas' });

  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ error: 'Error al crear cita' });
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
    if (citaActual.length === 0)
      return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = citaActual[0];

    if (fecha_hora && fecha_hora !== cita.fecha_hora) {
      const conflicto = await hayConflictoCita(cita.médico_id, fecha_hora, cita.id);
      if (conflicto) {
        return res.status(409).json({ error: 'Ese horario ya está ocupado para este médico' });
      }
    }

    // Actualizar cita
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

    // Obtener info del paciente y su usuario_id
    const [pacienteData] = await query(
      `SELECT nombre, apellidos, usuario_id FROM Pacientes WHERE id = ?`,
      [cita.paciente_id]
    );
    const nombrePaciente = pacienteData.length > 0
      ? `${pacienteData[0].nombre} ${pacienteData[0].apellidos}`
      : 'Paciente';
    const usuarioIdPaciente = pacienteData[0]?.usuario_id;

    // Obtener usuario_id del médico
    const [medicoData] = await query(
      `SELECT usuario_id FROM Medicos WHERE id = ?`,
      [cita.médico_id]
    );
    const usuarioIdMedico = medicoData[0]?.usuario_id;

    const nuevaFecha = fecha_hora || cita.fecha_hora;

    // Insertar alerta para paciente
    if (usuarioIdPaciente) {
      await query(
        `INSERT INTO Alertas (tipo, destinatario_id, mensaje)
         VALUES ('cita', ?, ?)`,
        [usuarioIdPaciente, `Tu cita ha sido actualizada: ${nuevaFecha}`]
      );
    }

    // Insertar alerta para médico
    if (usuarioIdMedico) {
      await query(
        `INSERT INTO Alertas (tipo, destinatario_id, mensaje)
         VALUES ('cita', ?, ?)`,
        [usuarioIdMedico, `Cita actualizada con ${nombrePaciente} para el ${nuevaFecha}`]
      );
    }

    res.json({ success: true, mensaje: 'Cita actualizada y alertas enviadas correctamente' });

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



