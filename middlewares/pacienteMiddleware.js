const { query } = require('../config/db.sql');

exports.validarTipoPaciente = (tiposPermitidos) => {
  return async (req, res, next) => {
    const { id } = req.params;

    try {
      // Consulta la tabla Patients 
      const resultados = await query('SELECT patient_type FROM Patients WHERE id = ?', [id]);
      const paciente = resultados[0]; 

      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      if (!tiposPermitidos.includes(paciente.patient_type)) {
        return res.status(400).json({
          error: `Esta operación solo está permitida para pacientes de tipo: ${tiposPermitidos.join(', ')}`
        });
      }

      req.paciente = paciente;
      next();
    } catch (error) {
      console.error('Error en validación de tipo de paciente:', error);
      res.status(500).json({
        error: 'Error interno del servidor al validar tipo de paciente'
      });
    }
  };
};
