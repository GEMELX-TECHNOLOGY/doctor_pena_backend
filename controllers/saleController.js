const { query } = require("../config/db.sql");

// Registrar una nueva venta
exports.createSale = async (req, res) => {
	try {
		const { patient_id, product_id, quantity } = req.body;

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

		// Registrar la venta (sin prescription_id)
		await query(
			`INSERT INTO Sales (patient_id, product_id, quantity, unit_price, total)
       VALUES (?, ?, ?, ?, ?)`,
			[patient_id, product_id, quantity, product.price, total],
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
        S.id, S.patient_id, S.product_id, S.quantity, S.unit_price, S.total, S.date,
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
			quantity: s.quantity,
			unit_price: s.unit_price,
			total: s.total,
			date: s.date,
		}));

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

// Las otras funciones (`getSaleById`, `updateSale`, `deleteSale`, `getMonthlyTotals`) no usan prescription_id y no requieren cambios.

