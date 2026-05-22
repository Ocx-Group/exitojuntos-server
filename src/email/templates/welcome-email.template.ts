export interface WelcomeEmailData {
  name: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  verificationCode: string;
  frontendUrl: string;
}

export const getWelcomeEmailTemplate = (params: WelcomeEmailData): string => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Éxito Juntos</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
        <tr>
            <td style="padding: 40px 20px; text-align: center;">
                <table role="presentation" style="width: 600px; max-width: 100%; margin: 0 auto; border-collapse: collapse; background-color: #000000; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 30px; text-align: center; border-bottom: 3px solid #d4af37;">
                            <h1 style="margin: 0 0 15px 0; color: #d4af37; font-size: 36px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
                                Éxito Juntos
                            </h1>
                            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 400; letter-spacing: 1px;">
                                BIENVENIDO A NUESTRA PLATAFORMA
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #ffffff; font-size: 18px; line-height: 1.8;">
                                Hola <strong style="color: #d4af37;">${params.name} ${params.lastName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 30px; color: #ffffff; font-size: 16px; line-height: 1.8;">
                                ¡Nos complace darte la bienvenida! Tu cuenta ha sido creada exitosamente y estamos emocionados de tenerte con nosotros.
                            </p>
                            
                            <!-- Divider -->
                            <div style="height: 2px; background-color: #d4af37; margin: 30px 0;"></div>
                            
                            <!-- Activation Section -->
                            <h2 style="margin: 30px 0 25px 0; color: #d4af37; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                                Activa tu cuenta
                            </h2>
                            
                            <p style="margin: 20px 0; color: #ffffff; font-size: 15px; line-height: 1.8;">
                                Para comenzar a disfrutar de todos los beneficios de Éxito Juntos, necesitas activar tu cuenta haciendo clic en el botón de abajo:
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${params.frontendUrl}/verify?code=${params.verificationCode}" style="display: inline-block; background-color: #d4af37; color: #000000; text-decoration: none; padding: 18px 60px; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 5px;">
                                            ACTIVAR CUENTA
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Important Notice -->
                            <p style="margin: 30px 0; padding: 20px; color: #ffffff; font-size: 14px; line-height: 1.6; border: 1px solid #d4af37; border-left: 4px solid #d4af37;">
                                <strong style="color: #d4af37;">Tus credenciales:</strong><br><br>
                                <strong>Usuario:</strong> ${params.username}<br>
                                <strong>Email:</strong> ${params.email}<br>
                                <strong>Teléfono:</strong> ${params.phone}<br>
                                <strong>Contraseña temporal:</strong> <span style="font-family: 'Courier New', monospace; color: #d4af37;">${params.password}</span><br><br>
                                <em style="color: #999;">Por tu seguridad, te recomendamos cambiar tu contraseña después de activar tu cuenta.</em>
                            </p>
                            
                            <!-- Divider -->
                            <div style="height: 2px; background-color: #d4af37; margin: 30px 0;"></div>
                            
                            <p style="margin: 30px 0 0; color: #ffffff; font-size: 15px; line-height: 1.8;">
                                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Estamos aquí para apoyarte en cada paso del camino.
                            </p>
                            
                            <p style="margin: 25px 0 0; color: #ffffff; font-size: 15px; line-height: 1.8;">
                                Saludos cordiales,<br>
                                <strong style="color: #d4af37;">El equipo de Éxito Juntos</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 30px; text-align: center; border-top: 3px solid #d4af37;">
                            <p style="margin: 0 0 10px; color: #999999; font-size: 13px; line-height: 1.6;">
                                Este es un correo automático, por favor no respondas a este mensaje.
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                                © ${new Date().getFullYear()} Éxito Juntos. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
};
