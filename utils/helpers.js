
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

// Generar ID único (PAC-39892)
exports.generarCustomId = async () => {
  let customId = '';
  let existe = true;

  do {
    const numero = Math.floor(10000 + Math.random() * 90000);
    customId = `PAC${numero}`;

    const [rows] = await query('SELECT id FROM Pacientes WHERE matricula = ?', [customId]);
    existe = rows.length > 0;
  } while (existe);

  return customId;
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

