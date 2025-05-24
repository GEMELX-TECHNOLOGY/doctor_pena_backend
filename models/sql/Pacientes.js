
const { query, getConnection } = require('../../config/db.sql');

class Paciente {
  // Crear un nuevo paciente con tipo
  static async createWithType(usuario_id, tipo_paciente, pacienteData) {
    const {
      nombre,
      apellidos,
      género,
      fecha_nacimiento,
      grupo_sanguíneo,
      alergias,
      enfermedades_crónicas,
      estatura_promedio,
      peso_promedio
    } = pacienteData;

    const result = await query(
      `INSERT INTO Pacientes 
      (usuario_id, nombre, apellidos, género, fecha_nacimiento, grupo_sanguíneo, 
       alergias, enfermedades_crónicas, estatura_promedio, peso_promedio, tipo_paciente) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario_id,
        nombre,
        apellidos,
        género,
        fecha_nacimiento,
        grupo_sanguíneo,
        alergias,
        enfermedades_crónicas,
        estatura_promedio,
        peso_promedio,
        tipo_paciente
      ]
    );
    
    return result.insertId; // Retorna el ID del paciente (no del usuario)
  }


  static async create(usuario_id, pacienteData) {
    return this.createWithType(usuario_id, 'adulto', pacienteData);
  }

  // Obtener datos específicos de bebé
  static async getDatosBebe(pacienteId) {
    const [rows] = await query(
      'SELECT * FROM DatosBebe WHERE paciente_id = ?',
      [pacienteId]
    );
    return rows[0] || null;
  }

  

  //  registrar datos de bebé
  static async createDatosBebe(pacienteId, datosBebe) {
    const result = await query(
      `INSERT INTO DatosBebe 
      (paciente_id, tipo_alimentacion, vacunas_completas, 
       frecuencia_alimentacion, peso_nacimiento, talla_nacimiento) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        pacienteId,
        datosBebe.tipo_alimentacion,
        datosBebe.vacunas_completas || 0,
        datosBebe.frecuencia_alimentacion,
        datosBebe.peso_nacimiento,
        datosBebe.talla_nacimiento
      ]
    );
    return result.insertId;
  }
}

module.exports = Paciente;