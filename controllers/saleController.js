const { query } = require("../config/db.sql");

// Registrar una nueva venta
exports.createSale = async (req, res) => {
	try {
		const {
			patient_id,
			product_id,
			prescription_id = null,
			quantity,
		} = req.body;

		// Verificar existencia y stock del producto
		const [productData] = await query(
			"SELECT price, stock FROM Products WHERE id = ?",
			[product_id],
		);
		if (productData.length === 0) {
			return res.status(404).json({ error: "Producto no encontrado" });
		}

		const product = productData[0];
		if (product.stock < quantity) {
			return res.status(400).json({ error: "Stock insuficiente" });
		}

		// Calcular total de la venta
		const total = parseFloat(product.price) * quantity;

		// Registrar la venta
		await query(
			`INSERT INTO Sales (patient_id, product_id, prescription_id, quantity, unit_price, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
			[patient_id, product_id, prescription_id, quantity, product.price, total],
		);

		// Actualizar stock del producto
		await query(`UPDATE Products SET stock = stock - ? WHERE id = ?`, [
			quantity,
			product_id,
		]);

		res.status(201).json({
			success: true,
			message: "Venta registrada exitosamente",
		});
	} catch (error) {
		console.error("Error al registrar venta:", error);
		res.status(500).json({
			error: "Error interno del servidor",
		});
	}
};

// Obtener todas las ventas
exports.getAllSales = async (_req, res) => {
	try {
		const [sales] = await query(`
      SELECT 
        S.*, 
        P.name AS product_name,
        P.description AS product_description,
        P.price AS product_price,
        P.image AS product_image,
        P.formula_salt AS product_formula,
        P.type AS product_type,
        P.barcode AS product_barcode,
        Pa.first_name AS patient_first_name, 
        Pa.last_name AS patient_last_name
      FROM Sales S
      JOIN Products P ON S.product_id = P.id
      JOIN Patients Pa ON S.patient_id = Pa.id
    `);

		// Limpiar y estructurar los datos en arreglos
		const cleanSales = sales.map((s) => ({
			id: s.id,
			patient: {
				id: s.patient_id,
				first_name: s.patient_first_name,
				last_name: s.patient_last_name,
			},
			product: {
				id: s.product_id,
				name: s.product_name,
				description: s.product_description,
				price: s.product_price,
				image: s.product_image,
				formula: s.product_formula,
				type: s.product_type,
				barcode: s.product_barcode,
			},
			prescription_id: s.prescription_id,
			quantity: s.quantity,
			unit_price: s.unit_price,
			total: s.total,
			date: s.date,
		}));
		//calculas total
		const total_sales = cleanSales.reduce(
			(acc, sale) => acc + parseFloat(sale.total),
			0,
		);

		res.json({
			total_sales,
			sales: cleanSales,
		});
	} catch (error) {
		console.error("Error al obtener ventas:", error);
		res.status(500).json({
			error: "Error al obtener las ventas",
		});
	}
};

// Obtener una venta por ID
exports.getSaleById = async (req, res) => {
	try {
		const { id } = req.params;
		const [sale] = await query("SELECT * FROM Sales WHERE id = ?", [id]);
		if (sale.length === 0) {
			return res.status(404).json({
				error: "Venta no encontrada",
			});
		}
		res.json(sale[0]);
	} catch (error) {
		console.error("Error al obtener venta:", error);
		res.status(500).json({
			error: "Error al obtener la venta",
		});
	}
};

// Actualizar una venta existente
exports.updateSale = async (req, res) => {
	try {
		const { id } = req.params;
		const { quantity } = req.body;

		// Verificar si la venta existe
		const [existingSale] = await query("SELECT * FROM Sales WHERE id = ?", [
			id,
		]);
		if (existingSale.length === 0) {
			return res.status(404).json({
				error: "Venta no encontrada",
			});
		}

		const sale = existingSale[0];
		const quantityDifference = quantity - sale.quantity;

		// Manejar cambios en el stock
		if (quantityDifference > 0) {
			const [productData] = await query(
				"SELECT stock FROM Products WHERE id = ?",
				[sale.product_id],
			);
			const product = productData[0];
			if (product.stock < quantityDifference) {
				return res.status(400).json({
					error: "Stock insuficiente para actualizar",
				});
			}
			await query("UPDATE Products SET stock = stock - ? WHERE id = ?", [
				quantityDifference,
				sale.product_id,
			]);
		} else if (quantityDifference < 0) {
			await query("UPDATE Products SET stock = stock + ? WHERE id = ?", [
				-quantityDifference,
				sale.product_id,
			]);
		}

		// Calcular nuevo total y actualizar venta
		const newTotal = sale.unit_price * quantity;

		await query(`UPDATE Sales SET quantity = ?, total = ? WHERE id = ?`, [
			quantity,
			newTotal,
			id,
		]);

		res.json({
			success: true,
			message: "Venta actualizada exitosamente",
		});
	} catch (error) {
		console.error("Error al actualizar venta:", error);
		res.status(500).json({
			error: "Error interno del servidor",
		});
	}
};

// Eliminar una venta
exports.deleteSale = async (req, res) => {
	try {
		const { id } = req.params;

		// Verificar si la venta existe
		const [existingSale] = await query("SELECT * FROM Sales WHERE id = ?", [
			id,
		]);
		if (existingSale.length === 0) {
			return res.status(404).json({
				error: "Venta no encontrada",
			});
		}

		const sale = existingSale[0];

		// Restaurar stock y eliminar venta
		await query("UPDATE Products SET stock = stock + ? WHERE id = ?", [
			sale.quantity,
			sale.product_id,
		]);
		await query("DELETE FROM Sales WHERE id = ?", [id]);

		res.json({
			success: true,
			message: "Venta eliminada exitosamente",
		});
	} catch (error) {
		console.error("Error al eliminar venta:", error);
		res.status(500).json({
			error: "Error interno del servidor",
		});
	}
};
exports.getMonthlyTotals = async (_req, res) => {
	try {
		const [results] = await query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') AS month,
        SUM(total) AS total_sales
      FROM Sales
      GROUP BY month
      ORDER BY month DESC
    `);

		res.json({
			success: true,
			monthly_totals: results,
		});
	} catch (error) {
		console.error("Error al obtener totales mensuales:", error);
		res.status(500).json({
			error: "Error al obtener los totales mensuales de ventas",
		});
	}
};
