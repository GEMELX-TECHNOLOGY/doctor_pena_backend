
const mongoose = require('mongoose');

const wearableDataSchema = new mongoose.Schema({
  pacienteId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  heartRate: { type: Number }, 
  bloodOxygen: { type: Number }, 
  temperature: { type: Number }, 
 
  isEmergency: { type: Boolean, default: false } // ESTADO
});

// Índice para búsquedas por paciente y fecha
wearableDataSchema.index({ pacienteId: 1, timestamp: -1 });

const WearableData = mongoose.model('WearableData', wearableDataSchema);

module.exports = WearableData;  