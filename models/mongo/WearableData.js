const mongoose = require('mongoose');

const wearableDataSchema = new mongoose.Schema({
  pacienteId: { type: String, required: true }, // matrícula del paciente en MySQL
  heartRate: Number,
  bloodOxygen: Number,
  temperature: Number,
  isEmergency: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WearableData', wearableDataSchema);
