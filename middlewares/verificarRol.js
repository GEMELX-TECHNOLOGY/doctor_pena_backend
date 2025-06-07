module.exports = (rolRequerido) => (req, res, next) => {
  const rolUsuario = req.user.rol;
  if (rolUsuario !== rolRequerido) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};
