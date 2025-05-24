require('dotenv').config();
const { sendPasswordResetEmail } = require('./services/emailService');

async function test() {
  try {
    await sendPasswordResetEmail('michelle.matetina@gmail.com', 'tokenprueba123');
    console.log('Email enviado correctamente');
  } catch (error) {
    console.error('Error enviando email:', error);
  }
}

test();
