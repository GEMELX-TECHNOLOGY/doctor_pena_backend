const admin = require("firebase-admin");

const serviceAccount = {
	type: process.env.FIREBASE_TYPE,
	project_id: process.env.FIREBASE_PROJECT_ID,
	private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
	private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
	client_email: process.env.FIREBASE_CLIENT_EMAIL,
	client_id: process.env.FIREBASE_CLIENT_ID,
	auth_uri: process.env.FIREBASE_AUTH_URI,
	token_uri: process.env.FIREBASE_TOKEN_URI,
	auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
	client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
	universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

try {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});
	const db = admin.firestore();
	console.log("✅ Conectado a Firebase Firestore correctamente");
	module.exports = { admin, db };
} catch (error) {
	console.error("❌ Error al conectar a Firebase Firestore:", error);
	process.exit(1);
}
