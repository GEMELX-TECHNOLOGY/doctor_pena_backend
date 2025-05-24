
const mongoose = require('mongoose');

const wearableDataSchema = new mongoose.Schema({
  pacienteId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  heartRate: { type: Number }, 
  bloodOxygen: { type: Number }, 
  temperature: { type: Number }, 
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number] } // [longitud, latitud]
  },
  isEmergency: { type: Boolean, default: false } // alertas
});

// Índice para búsquedas por paciente y fecha
wearableDataSchema.index({ pacienteId: 1, timestamp: -1 });

const WearableData = mongoose.model('WearableData', wearableDataSchema);

module.exports = WearableData;  