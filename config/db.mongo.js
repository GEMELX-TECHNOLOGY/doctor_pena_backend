const mongoose = require('mongoose');

const connectMongoDB = async () => {
    const uri = process.env.MONGO_URI;

    

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
console.log('MONGO_URI:', process.env.MONGO_URI);

module.exports = { connectMongoDB };
