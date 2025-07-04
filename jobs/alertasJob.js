const cron = require("node-cron");
const { generarAlertasAutomaticas } = require("../utils/alertasAuto");

// Ejecutar todos los días a las 7:00 AM
cron.schedule("0 7 * * *", () => {
	console.log(" Ejecutando verificación automática de productos...");
	generarAlertasAutomaticas();
});
