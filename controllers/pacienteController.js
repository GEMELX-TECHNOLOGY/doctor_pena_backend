
const { query } = require('../config/db.sql');
const { generarCustomId, calcularEdad,detectarCambiosPaciente } = require('../utils/helpers');

const gruposValidos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

exports.registrarPacienteWeb = async (req, res) => {
  try {
    const {
      nombre,
      apellidos,
      genero,
      fecha_nacimiento,
      grupo_sanguineo,
      alergias,
      enfermedades_cronicas,
      estatura_promedio,
      peso_promedio,
      foto,
      datos_bebe,
      datos_nino,
      datos_adolescente,
      datos_mujer_reproductiva,
      datos_adulto
    } = req.body;

    if (!gruposValidos.includes(grupo_sanguineo)) {
      return res.status(400).json({ error: 'Grupo sanguíneo inválido' });
    }

    const edad = calcularEdad(fecha_nacimiento);
    const matricula = await generarCustomId();

    // Clasificar tipo de paciente
    let tipo_paciente = 'adulto';
    if (edad <= 2) tipo_paciente = 'bebe';
    else if (edad <= 12) tipo_paciente = 'nino';
    else if (edad >= 13 && edad <= 17) tipo_paciente = 'adolescente';
    else if (edad >= 18 && edad <= 49 && genero.toLowerCase() === 'femenino') tipo_paciente = 'mujer_reproductiva';

    // Insertar en Pacientes
    const [resultado] = await query(
      `INSERT INTO Pacientes 
       (matricula, nombre, apellidos, genero, fecha_nacimiento, grupo_sanguineo, alergias, enfermedades_cronicas, estatura_promedio, peso_promedio, tipo_paciente, foto) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        matricula,
        nombre,
        apellidos,
        genero,
        fecha_nacimiento,
        grupo_sanguineo,
        alergias,
        enfermedades_cronicas,
        estatura_promedio,
        peso_promedio,
        tipo_paciente,
        foto
      ]
    );

    const pacienteId = resultado.insertId;

    // Insertar en tabla según tipo
    switch (tipo_paciente) {
      case 'bebe':
        await query(
          `INSERT INTO DatosBebe (paciente_id, tipo_alimentacion, vacunas_completas, frecuencia_alimentacion, peso_nacimiento, talla_nacimiento, notas) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            pacienteId,
            datos_bebe?.tipo_alimentacion || null,
            datos_bebe?.vacunas_completas || null,
            datos_bebe?.frecuencia_alimentacion || null,
            datos_bebe?.peso_nacimiento || null,
            datos_bebe?.talla_nacimiento || null,
            datos_bebe?.notas || null
          ]
        );
        break;

      case 'nino':
        await query(
          `INSERT INTO DatosNino (paciente_id, nombre_tutor, telefono_emergencia, alergias_comunes, actividades_extracurriculares) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            pacienteId,
            datos_nino?.nombre_tutor || null,
            datos_nino?.telefono_emergencia || null,
            datos_nino?.alergias_comunes || null,
            datos_nino?.actividades_extracurriculares || null
          ]
        );
        break;

      case 'adolescente':
        await query(
          `INSERT INTO Datos_Adolescente (paciente_id, escolaridad, vive_con_padres, actividad_fisica) 
           VALUES (?, ?, ?, ?)`,
          [
            pacienteId,
            datos_adolescente?.escolaridad || null,
            datos_adolescente?.vive_con_padres || null,
            datos_adolescente?.actividad_fisica || null
          ]
        );
        break;

      case 'mujer_reproductiva':
        await query(
          `INSERT INTO DatosMujerReproductiva (paciente_id, fecha_ultima_menstruacion, metodo_anticonceptivo, embarazos_previos, ciclos_irregulares) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            pacienteId,
            datos_mujer_reproductiva?.fecha_ultima_menstruacion || null,
            datos_mujer_reproductiva?.metodo_anticonceptivo || null,
            datos_mujer_reproductiva?.embarazos_previos || null,
            datos_mujer_reproductiva?.ciclos_irregulares || null
          ]
        );
        break;

      case 'adulto':
        await query(
          `INSERT INTO Datos_Adulto (paciente_id, ocupacion, estado_civil, escolaridad) 
           VALUES (?, ?, ?, ?)`,
          [
            pacienteId,
            datos_adulto?.ocupacion || null,
            datos_adulto?.estado_civil || null,
            datos_adulto?.escolaridad || null
          ]
        );
        break;
    }

    res.status(201).json({
      success: true,
      mensaje: 'Paciente registrado correctamente',
      matricula: matricula,
      edad,
      tipo_paciente
    });

  } catch (error) {
    console.error('Error al registrar paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
};



exports.obtenerTodos = async (req, res) => {
  try {
    const [pacientes] = await query('SELECT * FROM Pacientes');
    res.json({ success: true, pacientes });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [resultado] = await query('SELECT * FROM Pacientes WHERE id = ?', [id]);

    if (resultado.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    res.json({ success: true, paciente: resultado[0] });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const campos = req.body;
    const usuarioModificador = req.user.userId;


    if (campos.grupo_sanguineo && !gruposValidos.includes(campos.grupo_sanguineo)) {
      return res.status(400).json({ error: 'Grupo sanguíneo inválido' });
    }

    const [original] = await query('SELECT * FROM Pacientes WHERE id = ?', [id]);
    if (original.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const cambios = detectarCambiosPaciente(original[0], campos);

    if (cambios.length === 0) {
      return res.json({ success: true, mensaje: 'No hubo cambios en los datos del paciente' });
    }

    const camposSet = Object.keys(campos).map(key => `${key} = ?`).join(', ');
    const valores = Object.values(campos);

    await query(`UPDATE Pacientes SET ${camposSet} WHERE id = ?`, [...valores, id]);

    for (const cambio of cambios) {
      await query(
        `INSERT INTO HistorialCambiosPacientes
         (paciente_id, campo_modificado, valor_anterior, valor_nuevo, modificado_por)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          cambio.campo,
          String(cambio.anterior ?? ''),
          String(cambio.nuevo),
          usuarioModificador
        ]
      );
    }

    res.json({
      success: true,
      mensaje: 'Paciente actualizado correctamente',
      cambios
    });

  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ error: 'Error al actualizar paciente' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Pacientes WHERE id = ?', [id]);

    res.json({ success: true, mensaje: 'Paciente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
};

