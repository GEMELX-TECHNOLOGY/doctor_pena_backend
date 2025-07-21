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
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="es">
  <head>
    <link rel="preload" as="image" href="https://imgur.com/PnAJcNy.jpg" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Hemos recibido tu solicitud para reestablecer tu contraseña</title>
    <div
      style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"></div>
  </head>
  <body
    style='background-color:rgb(243,244,246);font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <!--$-->
    <table
      align="center"
      width="100%"
      border="0"
      cellpadding="0"
      cellspacing="0"
      role="presentation"
      style="background-color:rgb(255,255,255);border-radius:8px;margin-left:auto;margin-right:auto;padding:32px;max-width:600px">
      <tbody>
        <tr style="width:100%">
          <td>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
              style="text-align:center;margin-bottom:32px">
              <tbody>
                <tr>
                  <td>
                    <img
                      alt="Logo de Doctor Peña"
                      height="50"
                      src="https://imgur.com/PnAJcNy.jpg"
                      style="width:300px;height:auto;object-fit:cover;margin-left:auto;margin-right:auto;display:block;outline:none;border:none;text-decoration:none"
                      width="500" />
                  </td>
                </tr>
              </tbody>
            </table>
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation">
              <tbody>
                <tr>
                  <td>
                    <h1
                      style="font-size:24px;font-weight:700;color:rgb(31,41,55);margin:0px;margin-bottom:24px">
                      ¿Has solicitado reestablecer tu contraseña?
                    </h1>
                    <p
                      style="font-size:16px;color:rgb(55,65,81);margin-bottom:16px;line-height:24px;margin-top:16px">
                      Haz click en el botón para reestablecerla.
                    </p>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="background-color:rgb(239,246,255);border-radius:8px;padding:16px;margin-bottom:24px">
                      <tbody>
                        <tr>
                          <td>
                            <p
                              style="font-size:16px;color:rgb(29,78,216);font-weight:500;margin:0px;line-height:24px;margin-bottom:0px;margin-top:0px;margin-left:0px;margin-right:0px">
                              El enlace caducará en:
                              <span style="font-weight:700">1 hora</span>.
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table
                      align="center"
                      width="100%"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      role="presentation"
                      style="text-align:center;margin-bottom:24px">
                      <tbody>
                        <tr>
                          <td>
                            <a
                              href=${resetLink}
                              style="background-color:rgb(37,99,235);color:rgb(255,255,255);padding-left:24px;padding-right:24px;padding-top:12px;padding-bottom:12px;border-radius:8px;font-size:16px;font-weight:500;text-decoration-line:none;box-sizing:border-box;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px;padding:12px 24px 12px 24px"
                              target="_blank"
                              ><span
                                ><!--[if mso]><i style="mso-font-width:400%;mso-text-raise:18" hidden>&#8202;&#8202;&#8202;</i><![endif]--></span
                              ><span
                                style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:9px"
                                >Reestablecer Contraseña</span
                              ><span
                                ><!--[if mso]><i style="mso-font-width:400%" hidden>&#8202;&#8202;&#8202;&#8203;</i><![endif]--></span
                              ></a
                            >
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p
                      style="font-size:16px;color:rgb(55,65,81);margin-bottom:16px;line-height:24px;margin-top:16px">
                      Si tú no has solicitado el cambio, haz caso omiso a este
                      correo.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <hr
              style="border-color:rgb(229,231,235);margin-top:16px;margin-bottom:16px;width:100%;border:none;border-top:1px solid #eaeaea" />
            <table
              align="center"
              width="100%"
              border="0"
              cellpadding="0"
              cellspacing="0"
              role="presentation">
              <tbody>
                <tr>
                  <td>
                    <p
                      style="font-size:14px;color:rgb(107,114,128);margin:0px;line-height:24px;margin-bottom:0px;margin-top:0px;margin-left:0px;margin-right:0px">
                      ©
                      <!-- -->2025<!-- -->
                      Doctor Peña. Todos los derechos reservados.
                    </p>
                    <p
                      style="font-size:14px;color:rgb(107,114,128);margin-top:8px;margin-bottom:0px;line-height:24px">
                      <a
                        href="mailto:noreply@gemlex.dev"
                        style="color:rgb(37,99,235);text-decoration-line:underline"
                        target="_blank"
                        >noreply@gemlex.dev</a
                      >
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!--7--><!--/$-->
  </body>
</html>

    `,
  };

  await transporter.sendMail(mailOptions);
};
