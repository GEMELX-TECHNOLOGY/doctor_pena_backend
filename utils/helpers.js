
const crypto = require('crypto');
const { query } = require('../config/db.sql'); 

// Genera un token seguro de recuperación
exports.generarTokenRecuperacion = () => {
    return crypto.randomBytes(20).toString('hex');
};

// Opcional: función para generar tokens JWT 
exports.generarTokenJWT = (payload, secret, expiresIn) => {
    return jwt.sign(payload, secret, { expiresIn });
};

// Generar ID único (CLI-001)
exports.generarCustomId = async () => {
    const [result] = await query('SELECT MAX(id) AS maxId FROM Pacientes');
    const nextId = (result[0].maxId || 0) + 1;
    return `CLI-${String(nextId).padStart(3, '0')}`;
};

// Calcular edad
exports.calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
};
// HISTORIALCAMBIOSPACIENTE
exports.detectarCambiosPaciente = (original, actualizado) => {
  const cambios = [];

  for (const campo in actualizado) {
    const nuevoValor = actualizado[campo];
    const valorOriginal = original[campo];

    // Comparar como strings para evitar diferencias de tipo (ej: 74.5 vs "74.50")
    if (nuevoValor != null && String(nuevoValor) !== String(valorOriginal)) {
      cambios.push({
        campo,
        anterior: valorOriginal,
        nuevo: nuevoValor
      });
    }
  }

  return cambios;
};

