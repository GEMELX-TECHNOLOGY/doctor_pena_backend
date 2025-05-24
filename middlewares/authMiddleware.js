const jwt = require('jsonwebtoken');
const { query } = require('../config/db.sql');

const verificarYRenovarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    try {
      const result =await query('UPDATE Usuarios SET ultimo_acceso = NOW() WHERE id = ?', [decoded.userId]);
      console.log('Update último_acceso resultado:', result);
    } catch (err) {
      console.error('Error al actualizar último_acceso:', err);
    }

    // Renovar token
    const nuevoToken = jwt.sign(
      { userId: decoded.userId, rol: decoded.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.locals.usuario = decoded;
    res.locals.nuevoToken = nuevoToken;

    res.setHeader('x-renewed-token', nuevoToken);

    next();

  } catch (err) {
    console.error('Error al verificar token:', err);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = verificarYRenovarToken;
