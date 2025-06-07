const mongoose = require('mongoose');

const connectMongoDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri || uri.includes('localhost')) {
        console.log('🔁 Saltando conexión a MongoDB: URI no válida para producción');
        return;
    }

    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado a MongoDB');
    } catch (error) {
        console.error('❌ Error de conexión a MongoDB:', error);
        process.exit(1);
    }
};

module.exports = { connectMongoDB };
