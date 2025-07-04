const nodemailer = require("nodemailer");

exports.sendPasswordResetEmail = async (toEmail, resetLink) => {
	const transporter = nodemailer.createTransport({
		host: process.env.EMAIL_HOST,
		port: parseInt(process.env.EMAIL_PORT),
		secure: true,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});

	const mailOptions = {
		from: process.env.EMAIL_FROM,
		to: toEmail,
		subject: "Restablece tu contraseña",
		html: `
      <p>Has solicitado restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para continuar:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Si tú no solicitaste esto, ignora este mensaje.</p>
    `,
	};

	await transporter.sendMail(mailOptions);
};
