
const { query } = require("../config/db.sql");


const { v4: uuidv4 } = require("uuid"); 

exports.createSale = async (req, res) => {
	try {
		const { patient_id, products } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Debes agregar al menos un producto" });
		}

		const sale_id = uuidv4(); // ID único para agrupar esta venta

		for (const { product_id, quantity } of products) {
			const [productData] = await query(
				"SELECT price, stock FROM Products WHERE id = ?",
				[product_id]
			);

			if (productData.length === 0) {
				return res.status(404).json({ error: `Producto ${product_id} no encontrado` });
			}

			const product = productData[0];

			if (product.stock < quantity) {
				return res.status(400).json({ error: `Stock insuficiente para producto ${product_id}` });
			}

			const total = parseFloat(product.price) * quantity;

			await query(
				`INSERT INTO Sales (patient_id, product_id, quantity, unit_price, total, sale_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
				[patient_id, product_id, quantity, product.price, total, sale_id]
			);

			await query(
				`UPDATE Products SET stock = stock - ? WHERE id = ?`,
				[quantity, product_id]
			);
		}

		res.status(201).json({
			success: true,
			message: "Venta registrada exitosamente",
			sale_id,
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
        S.sale_id, S.date, S.patient_id, S.product_id, S.quantity, S.unit_price, S.total,
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
      ORDER BY S.date DESC
    `);

		// Agrupar por sale_id
		const grouped = {};
		for (const s of sales) {
			if (!grouped[s.sale_id]) {
				grouped[s.sale_id] = {
					sale_id: s.sale_id,
					date: s.date,
					patient: {
						id: s.patient_id,
						first_name: s.patient_first_name,
						last_name: s.patient_last_name,
					},
					productos: [],
					total_venta: 0,
				};
			}

			grouped[s.sale_id].productos.push({
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
			});

			grouped[s.sale_id].total_venta += parseFloat(s.total);
		}

		const ventas = Object.values(grouped);
		const total_sales = ventas.reduce((acc, venta) => acc + venta.total_venta, 0);

		res.json({
			total_sales,
			ventas,
		});
	} catch (error) {
		console.error("Error al obtener ventas agrupadas:", error);
		res.status(500).json({
			error: "Error al obtener las ventas agrupadas",
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
		const [monthlyResults] = await query(`
			SELECT 
				DATE_FORMAT(date, '%Y-%m') AS month,
				SUM(total) AS total_sales
			FROM Sales
			GROUP BY month
			ORDER BY month DESC
		`);

		const [weeklyResults] = await query(`
			SELECT 
				DATE_FORMAT(date, '%Y-%u') AS week,
				MIN(DATE(date)) AS start_date,
				MAX(DATE(date)) AS end_date,
				SUM(total) AS total_sales
			FROM Sales
			WHERE YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)
			GROUP BY week
		`);

		res.json({
			success: true,
			monthly_totals: monthlyResults,
			current_week_totals: weeklyResults[0] || {
				week: null,
				start_date: null,
				end_date: null,
				total_sales: 0,
			},
		});
	} catch (error) {
		console.error("Error al obtener totales mensuales y semanales:", error);
		res.status(500).json({
			error: "Error al obtener los totales de ventas",
		});
	}
};

exports.getSaleBySaleId = async (req, res) => {
	try {
		const { sale_id } = req.params;
		const [sales] = await query(`
			SELECT 
				S.sale_id, S.date, S.patient_id, S.product_id, S.quantity, S.unit_price, S.total,
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
			WHERE S.sale_id = ?
			ORDER BY S.date DESC
		`, [sale_id]);

		if (sales.length === 0) {
			return res.status(404).json({ error: "Venta no encontrada para ese sale_id" });
		}

		// Agrupar los productos bajo el sale_id
		const venta = {
			sale_id: sales[0].sale_id,
			date: sales[0].date,
			patient: {
				id: sales[0].patient_id,
				first_name: sales[0].patient_first_name,
				last_name: sales[0].patient_last_name,
			},
			productos: [],
			total_venta: 0,
		};

		for (const s of sales) {
			venta.productos.push({
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
			});

			venta.total_venta += parseFloat(s.total);
		}

		res.json(venta);
	} catch (error) {
		console.error("Error al obtener venta por sale_id:", error);
		res.status(500).json({
			error: "Error interno del servidor",
		});
	}
};
