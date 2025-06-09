const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json'); 
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();
  console.log('✅ Conectado a Firebase Firestore correctamente');
  
  module.exports = { admin, db };
} catch (error) {
  console.error('❌ Error al conectar a Firebase Firestore:', error);
  process.exit(1);
}
