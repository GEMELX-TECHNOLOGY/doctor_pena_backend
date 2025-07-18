const { query } = require("../config/db.sql");

exports.createPrescription = async (req, res) => {
  try {
    const { register_number_patient } = req.body;
    const file = req.file;

    if (!register_number_patient || !file) {
      return res.status(400).json({ error: "Paciente y archivo son requeridos." });
    }

   
    const fileUrl = file.path;

    const sql = `
      INSERT INTO prescriptions (file_url, register_number_patient)
      VALUES (?, ?)
    `;

    await query(sql, [fileUrl, register_number_patient]);

    res.status(201).json({ message: "Receta guardada correctamente.", fileUrl });
  } catch (error) {
    console.error("Error al guardar receta:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};
