
const { query } = require('../config/db.sql');

// Crear receta
exports.crearReceta = async (req, res) => {
  try {
    const { consulta_id, instrucciones, tamaño_impresión } = req.body;

    // Verificar si ya existe una receta para esa consulta
    const [existe] = await query('SELECT id FROM Recetas WHERE consulta_id = ?', [consulta_id]);
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Ya existe una receta para esta consulta' });
    }

    await query(
      `INSERT INTO Recetas (consulta_id, fecha, instrucciones, tamaño_impresión)
       VALUES (?, NOW(), ?, ?)`,
      [consulta_id, instrucciones, tamaño_impresión]
    );

    res.status(201).json({ success: true, mensaje: 'Receta registrada correctamente' });
  } catch (error) {
    console.error('Error al crear receta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener receta por consulta_id
exports.verRecetaPorConsulta = async (req, res) => {
  try {
    const consulta_id = req.params.id;
    const [receta] = await query('SELECT * FROM Recetas WHERE consulta_id = ?', [consulta_id]);
    if (receta.length === 0) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }
    res.json({ success: true, receta: receta[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la receta' });
  }
};

// Obtener todos los datos necesarios para imprimir una receta
exports.obtenerDatosRecetaParaImpresion = async (req, res) => {
  try {
    const consulta_id = req.params.id;

    const [consulta] = await query(
      `SELECT c.*, p.nombre AS nombre_paciente, p.apellidos AS apellidos_paciente, 
              p.genero, p.fecha_nacimiento, 
              m.nombre AS nombre_doctor, m.apellido AS apellido_doctor, 
              m.cedula, m.consultorio, m.horario_atencion
       FROM Consultas c
       INNER JOIN Pacientes p ON c.paciente_id = p.id
       INNER JOIN Medicos m ON c.médico_id = m.id
       WHERE c.id = ?`,
      [consulta_id]
    );

    if (consulta.length === 0) {
      return res.status(404).json({ error: 'Consulta no encontrada' });
    }

    const [signos] = await query('SELECT * FROM SignosVitales WHERE consulta_id = ?', [consulta_id]);
    const [receta] = await query('SELECT * FROM Recetas WHERE consulta_id = ?', [consulta_id]);

    if (receta.length === 0) {
      return res.status(404).json({ error: 'Receta no encontrada para esta consulta' });
    }

    const datos = {
      consulta: consulta[0],
      signos_vitales: signos.length > 0 ? signos[0] : null,
      receta: receta[0]
    };

    res.json({ success: true, datos });
  } catch (error) {
    console.error('Error al generar datos de impresión:', error);
    res.status(500).json({ error: 'Error al generar los datos de la receta' });
  }
};
