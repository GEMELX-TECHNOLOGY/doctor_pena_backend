const { query } = require('../config/db.sql');

// Función para verificar si el usuario es administrador
function isAdmin(req, res) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Acceso restringido a administradores' });
    return false;
  }
  return true;
}

// Obtener todos los médicos
exports.getAllDoctors = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM Doctors');
    res.json({ success: true, doctors: rows });
  } catch (err) {
    console.error('Error al obtener médicos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener un médico por ID
exports.getDoctorById = async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM Doctors WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Médico no encontrado' });
    res.json({ success: true, doctor: rows[0] });
  } catch (err) {
    console.error('Error al obtener médico:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear un nuevo médico (solo administradores)
exports.createDoctor = async (req, res) => {
  if (!isAdmin(req, res)) return;

  try {
    const { first_name, last_name, specialty, license_number, schedule, office, user_id } = req.body;

    await query(
      `INSERT INTO Doctors (user_id, first_name, last_name, specialty, license_number, schedule, office)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, first_name, last_name, specialty, license_number, schedule, office]
    );

    res.status(201).json({ success: true, message: 'Médico registrado exitosamente' });
  } catch (err) {
    console.error('Error al registrar médico:', err);
    res.status(500).json({ error: 'Error al registrar médico' });
  }
};

// Actualizar información de un médico (solo administradores)
exports.updateDoctor = async (req, res) => {
  if (!isAdmin(req, res)) return;

  try {
    const { first_name, last_name, specialty, license_number, schedule, office } = req.body;
    const [result] = await query(
      `UPDATE Doctors SET 
        first_name = ?, 
        last_name = ?, 
        specialty = ?, 
        license_number = ?, 
        schedule = ?, 
        office = ? 
       WHERE id = ?`,
      [first_name, last_name, specialty, license_number, schedule, office, req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Médico no encontrado' });

    res.json({ success: true, message: 'Médico actualizado exitosamente' });
  } catch (err) {
    console.error('Error al actualizar médico:', err);
    res.status(500).json({ error: 'Error al actualizar médico' });
  }
};

// Eliminar un médico (solo administradores)
exports.deleteDoctor = async (req, res) => {
  if (!isAdmin(req, res)) return;

  try {
    const [result] = await query('DELETE FROM Doctors WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Médico no encontrado' });

    res.json({ success: true, message: 'Médico eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar médico:', err);
    res.status(500).json({ error: 'Error al eliminar médico' });
  }
};