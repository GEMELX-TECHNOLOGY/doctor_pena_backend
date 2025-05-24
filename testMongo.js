require('dotenv').config();
const mongoose = require('mongoose');
const WearableData = require('./models/mongo/WearableData');

async function testMongo() {
    try {
        //  Conectar
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado a MongoDB');
        
        //  Crear dato de prueba
        const testData = new WearableData({
            pacienteId: 'CLI-001',
            heartRate: 75,
            bloodOxygen: 98,
            temperature: 36.5,
            location: {
                type: 'Point',
                coordinates: [-99.1234, 19.4326] 
            }
        });
        
        //  Guardar
        const saved = await testData.save();
        console.log('Dato guardado:', saved);
        
        // Consultar
        const found = await WearableData.find({ pacienteId: 'CLI-001' });
        console.log('Datos encontrados:', found);
        
    } catch (error) {
        console.error('Error en prueba:', error);
    } finally {
        mongoose.disconnect();
    }
}

testMongo();