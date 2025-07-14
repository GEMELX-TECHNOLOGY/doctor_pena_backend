const { query } = require("../config/db.sql");

// Registrar un nuevo producto
exports.createProduct = async (req, res) => {
  try {
    const {
      barcode,
      name,
      description,
      formula_salt,
      type,
      price,
      stock,
      minimum_stock,
      location,
      expiration,
      supplier,
      
    } = req.body;

    // La URL pública de la imagen subida en Cloudinary
    const imageUrl = req.file?.path || null;

    await query(
      `INSERT INTO Products 
      (barcode, name, description, formula_salt, type, price, stock, minimum_stock, location, expiration, supplier, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        barcode,
        name,
        description,
        formula_salt,
        type,
        price,
        stock,
        minimum_stock,
        location,
        expiration,
        supplier,
        imageUrl,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Producto registrado exitosamente",
      imageUrl,
    });
  } catch (error) {
    console.error("Error al registrar producto:", error);
    res.status(500).json({
      error: "Error al registrar el producto",
    });
  }
};


// Obtener todos los productos
exports.getAllProducts = async (_req, res) => {
	try {
		const [rows] = await query("SELECT * FROM Products ORDER BY name ASC");
		res.json({
			success: true,
			products: rows,
		});
	} catch (error) {
		console.error("Error al obtener productos:", error);
		res.status(500).json({
			error: "Error al obtener los productos",
		});
	}
};

// Obtener un producto por ID
exports.getProductById = async (req, res) => {
	try {
		const { id } = req.params;
		const [rows] = await query("SELECT * FROM Products WHERE id = ?", [id]);

		if (rows.length === 0) {
			return res.status(404).json({
				error: "Producto no encontrado",
			});
		}

		res.json({
			success: true,
			product: rows[0],
		});
	} catch (error) {
		console.error("Error al obtener producto:", error);
		res.status(500).json({
			error: "Error al obtener el producto",
		});
	}
};

// Actualizar un producto existente
exports.updateProduct = async (req, res) => {
	try {
		const { id } = req.params;
		const fields = req.body;

		// Construir la consulta de actualización dinámica
		const fieldsSet = Object.keys(fields)
			.map((key) => `${key} = ?`)
			.join(", ");
		const values = Object.values(fields);

		await query(`UPDATE Products SET ${fieldsSet} WHERE id = ?`, [
			...values,
			id,
		]);

		res.json({
			success: true,
			message: "Producto actualizado exitosamente",
		});
	} catch (error) {
		console.error("Error al actualizar producto:", error);
		res.status(500).json({
			error: "Error al actualizar el producto",
		});
	}
};

// Eliminar un producto
exports.deleteProduct = async (req, res) => {
	try {
		const { id } = req.params;

		await query("DELETE FROM Products WHERE id = ?", [id]);

		res.json({
			success: true,
			message: "Producto eliminado exitosamente",
		});
	} catch (error) {
		console.error("Error al eliminar producto:", error);
		res.status(500).json({
			error: "Error al eliminar el producto",
		});
	}
};
