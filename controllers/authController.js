require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db.sql'); // Conexión a MySQL
const { generarTokenRecuperacion } = require('../utils/helpers');
const { sendPasswordResetEmail } = require('../services/emailService');

// Roles permitidos para web y app
const rolesWeb = ['medico', 'admin'];
const rolesApp = ['paciente', 'medico', 'admin'];

// Función común para registrar usuarios con roles permitidos según contexto
async function registrarUsuario(req, res, rolesPermitidos) {
    try {
        const { email, password, rol, telefono } = req.body;

        if (!rolesPermitidos.includes(rol)) {
            return res.status(400).json({
                error: 'Rol inválido para este tipo de registro'
            });
        }

        // Verificar si el usuario ya existe
        const [existingUsers] = await query('SELECT * FROM Usuarios WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Hashear contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar nuevo usuario en la tabla Usuarios
        const [result] = await query(
            `INSERT INTO Usuarios 
            (rol, email, telefono, contrasena_hash, estado) 
            VALUES (?, ?, ?, ?, 'activo')`,
            [rol, email, telefono, hashedPassword]
        );

        const insertId = result.insertId;

        // Insertar en tabla Pacientes si es paciente
        if (rol === 'paciente') {
            const {
                nombre,
                apellidos,
                genero,
                fecha_nacimiento,
                grupo_sanguineo,
                alergias,
                enfermedades_cronicas,
                estatura_promedio,
                peso_promedio
            } = req.body;

            await query(
                `INSERT INTO Pacientes 
                (usuario_id, nombre, apellidos, genero, fecha_nacimiento, grupo_sanguineo, alergias, enfermedades_cronicas, estatura_promedio, peso_promedio) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    insertId,
                    nombre,
                    apellidos,
                    genero,
                    fecha_nacimiento,
                    grupo_sanguineo,
                    alergias,
                    enfermedades_cronicas,
                    estatura_promedio,
                    peso_promedio
                ]
            );
        }

        // Insertar en tabla Médicos si es médico
        if (rol === 'medico') {
            const { nombre, apellido, especialidad, cedula, horario_atencion, consultorio } = req.body;

            if (!nombre || !apellido || !especialidad || !cedula || !horario_atencion || !consultorio) {
                return res.status(400).json({
                    error: 'Faltan campos obligatorios para registrar un médico'
                });
            }

            await query(
                `INSERT INTO Medicos 
                (usuario_id, nombre, apellido, especialidad, cedula, horario_atencion, consultorio) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [insertId, nombre, apellido, especialidad, cedula, horario_atencion, consultorio]
            );
        }

        // Generar token JWT
        const token = jwt.sign(
            { userId: insertId, rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            success: true,
            userId: insertId,
            token
        });

    } catch (error) {
        console.error('Error en registro:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'El correo electrónico ya está registrado (desde MySQL)'
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor al registrar usuario',
            detalle: error.message
        });
    }
}

// Exportar funciones específicas para cada tipo de registro
exports.registerWeb = (req, res) => registrarUsuario(req, res, rolesWeb);
exports.registerApp = (req, res) => registrarUsuario(req, res, rolesApp);

// Función para iniciar sesión
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await query(
            'SELECT * FROM Usuarios WHERE email = ?',
            [email]
        );

        const user = users[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const passwordMatch = await bcrypt.compare(password, user.contrasena_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        //  ACTUALIZAR ultimo acceso
        await query('UPDATE Usuarios SET ultimo_acceso = NOW() WHERE id = ?', [user.id]);

        const token = jwt.sign(
            { userId: user.id, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            error: 'Error interno del servidor al iniciar sesión'
        });
    }
};




// Función para solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Buscar usuario
    const [users] = await query('SELECT * FROM Usuarios WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ error: 'No existe un usuario con ese correo' });
    }

    //  Generar token de recuperación y expiración
    const resetToken = generarTokenRecuperacion();
    const expiration = new Date(Date.now() + 3600000); // 1 hora

    // Guardar token y expiración en base de datos
    await query(
      `UPDATE Usuarios SET reset_token = ?, reset_token_expiration = ? WHERE id = ?`,
      [resetToken, expiration, user.id]
    );

    //  Enviar email con el token
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(email, resetLink);

    console.log(` Token enviado a ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'Se ha enviado un enlace para restablecer la contraseña'
    });

  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({
      error: 'Error al procesar la solicitud de recuperación',
      detalle: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Función para restablecer contraseña
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    const [users] = await query(
      `SELECT * FROM Usuarios WHERE reset_token = ? AND reset_token_expiration > NOW()`,
      [token]
    );

    const user = users[0];
    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await query(
      `UPDATE Usuarios SET contrasena_hash = ?, reset_token = NULL, reset_token_expiration = NULL WHERE id = ?`,
      [hashedPassword, user.id]
    );

    if (result.affectedRows === 0) {
      console.error('No se actualizó la contraseña para usuario:', user.id);
      return res.status(500).json({ error: 'No se pudo actualizar la contraseña' });
    }

    console.log(`Contraseña actualizada para usuario ID: ${user.id}`);
    res.json({ success: true, message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};


// Función para renovar token JWT
exports.refreshToken = async (req, res) => {
  try {
    const oldToken = req.headers.authorization?.split(' ')[1];
    if (!oldToken) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, { ignoreExpiration: true });

    // Actualizar último acceso en la base de datos
    await query('UPDATE Usuarios SET ultimo_acceso = NOW() WHERE id = ?', [decoded.userId]);

    // Generar nuevo token
    const newToken = jwt.sign(
      { userId: decoded.userId, rol: decoded.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      token: newToken
    });

  } catch (error) {
    console.error('Error en refreshToken:', error);
   res.status(401).json({ error: 'Token inválido o expirado' });
   }
};
exports.actualizarCredencialesAdmin = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { email, nuevaContrasena } = req.body;

    if (req.user?.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo el administrador puede actualizar sus credenciales' });
    }

    const updates = [];
    const values = [];

    const emailNormalizado = email?.trim().toLowerCase();
    updates.push('email = ?');
    values.push(emailNormalizado);


    if (nuevaContrasena) {
      const hashed = await bcrypt.hash(nuevaContrasena, 10);
      updates.push('contrasena_hash = ?');
      values.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    values.push(adminId);

    await query(`UPDATE Usuarios SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ success: true, mensaje: 'Credenciales actualizadas correctamente' });
  } catch (err) {
    console.error('Error actualizando credenciales del admin:', err);
    res.status(500).json({ error: 'Error interno al actualizar' });
  }
};
exports.registroPacienteApp = async (req, res) => {
    try {
        const { email, password, telefono, matricula } = req.body;

        const rol = 'paciente'; // ← Fijamos el rol directamente

        if (!matricula) {
            return res.status(400).json({ error: 'Matrícula requerida para el registro' });
        }

        // Verificar si la matrícula existe y no está vinculada aún
        const [pacienteRows] = await query('SELECT * FROM Pacientes WHERE matricula = ?', [matricula]);
        if (pacienteRows.length === 0) {
            return res.status(404).json({ error: 'Matrícula no encontrada' });
        }

        const paciente = pacienteRows[0];
        if (paciente.usuario_id) {
            return res.status(400).json({ error: 'Esta matrícula ya está vinculada a un usuario' });
        }

        // Verificar si el email ya está registrado
        const [usuariosExistentes] = await query('SELECT * FROM Usuarios WHERE email = ?', [email]);
        if (usuariosExistentes.length > 0) {
            return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar en tabla Usuarios
        const [usuarioResult] = await query(`
            INSERT INTO Usuarios (rol, email, telefono, contrasena_hash, estado)
            VALUES (?, ?, ?, ?, 'activo')
        `, [rol, email, telefono, hashedPassword]);

        const nuevoUsuarioId = usuarioResult.insertId;

        // Vincular usuario con el paciente
        await query('UPDATE Pacientes SET usuario_id = ? WHERE id = ?', [nuevoUsuarioId, paciente.id]);

        // Generar token
        const token = jwt.sign(
            { userId: nuevoUsuarioId, rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            success: true,
            mensaje: 'Registro exitoso',
            usuario_id: nuevoUsuarioId,
            paciente_id: paciente.id,
            token
        });

    } catch (error) {
        console.error('Error en el registro de paciente:', error);
        res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
    }
};
exports.actualizarCredencialesPaciente = async (req, res) => {
  try {
    const pacienteId = req.user?.userId;
    const { email, nuevaContrasena } = req.body;

    if (req.user?.rol !== 'paciente') {
      return res.status(403).json({ error: 'Solo el paciente puede actualizar sus credenciales' });
    }

    const updates = [];
    const values = [];

    const emailNormalizado = email?.trim().toLowerCase();
    updates.push('email = ?');
    values.push(emailNormalizado);

    if (nuevaContrasena) {
      const hashed = await bcrypt.hash(nuevaContrasena, 10);
      updates.push('contrasena_hash = ?');
      values.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    values.push(pacienteId);

    await query(`UPDATE Usuarios SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ success: true, mensaje: 'Credenciales actualizadas correctamente' });
  } catch (err) {
    console.error('Error actualizando credenciales del paciente:', err);
    res.status(500).json({ error: 'Error interno al actualizar' });
  }
};
exports.eliminarCuentaPaciente = async (req, res) => {
  try {
    const pacienteId = req.user?.userId;
    const rol = req.user?.rol;

    if (rol !== 'paciente') {
      return res.status(403).json({ error: 'Solo los pacientes pueden eliminar su cuenta' });
    }

    const [usuario] = await query('SELECT * FROM Usuarios WHERE id = ? AND rol = "paciente"', [pacienteId]);

    if (!usuario) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    await query('UPDATE Usuarios SET estado = "inactivo" WHERE id = ?', [pacienteId]);

    res.json({ success: true, mensaje: 'Cuenta desactivada correctamente' });
  } catch (err) {
    console.error('Error al eliminar cuenta de paciente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

