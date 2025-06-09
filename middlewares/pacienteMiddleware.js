const { query } = require('../config/db.sql');

exports.validarTipoPaciente = (tiposPermitidos) => {
  return async (req, res, next) => {
    const { id } = req.params;
    
    try {
      const [paciente] = await query('SELECT tipo_paciente FROM Pacientes WHERE id = ?', [id]);
      
      if (!paciente) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }
      
      if (!tiposPermitidos.includes(paciente.tipo_paciente)) {
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

