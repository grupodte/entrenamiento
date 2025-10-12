// api/send-notification.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, userEmail, userName, itemName, trainerName } = req.body;

  try {
    let subject, html;

    if (type === 'rutina') {
      subject = '🎯 ¡Nueva rutina asignada!';
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: #121212; border-radius: 16px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%); padding: 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { padding: 30px; }
              .greeting { color: #ffffff; font-size: 18px; margin-bottom: 16px; }
              .message { color: #B5B5B5; font-size: 16px; margin-bottom: 20px; line-height: 1.6; }
              .item-info { background: #1a1a1a; border-left: 4px solid #FF0000; padding: 16px; border-radius: 8px; margin: 20px 0; }
              .item-name { color: #FF0000; font-size: 20px; font-weight: bold; margin-bottom: 8px; }
              .trainer-info { color: #ffffff; font-size: 14px; }
              .cta-button { display: inline-block; background: #FF0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { background: #0a0a0a; padding: 20px; text-align: center; border-top: 1px solid #333; }
              .footer p { color: #666; margin: 0; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💪 ¡Nueva Rutina Asignada!</h1>
              </div>
              <div class="content">
                <div class="greeting">¡Hola ${userName}! 👋</div>
                <div class="message">Tenemos excelentes noticias para ti. Tu entrenador ha preparado una nueva rutina personalizada.</div>
                <div class="item-info">
                  <div class="item-name">${itemName}</div>
                  <div class="trainer-info">Asignada por: ${trainerName}</div>
                </div>
                <div style="text-align: center;">
                  <a href="https://tu-app.com/dashboard" class="cta-button">Ver Mi Rutina 🚀</a>
                </div>
                <div class="message">¡Estamos aquí para apoyarte en cada paso! 🔥</div>
              </div>
              <div class="footer">
                <p>FitApp - Tu compañero de entrenamiento</p>
              </div>
            </div>
          </body>
        </html>
      `;
    } else if (type === 'dieta') {
      subject = '🥗 ¡Nueva dieta asignada!';
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: #121212; border-radius: 16px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%); padding: 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { padding: 30px; }
              .greeting { color: #ffffff; font-size: 18px; margin-bottom: 16px; }
              .message { color: #B5B5B5; font-size: 16px; margin-bottom: 20px; line-height: 1.6; }
              .item-info { background: #1a1a1a; border-left: 4px solid #FF0000; padding: 16px; border-radius: 8px; margin: 20px 0; }
              .item-name { color: #FF0000; font-size: 20px; font-weight: bold; margin-bottom: 8px; }
              .trainer-info { color: #ffffff; font-size: 14px; }
              .cta-button { display: inline-block; background: #FF0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { background: #0a0a0a; padding: 20px; text-align: center; border-top: 1px solid #333; }
              .footer p { color: #666; margin: 0; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🥗 ¡Nueva Dieta Asignada!</h1>
              </div>
              <div class="content">
                <div class="greeting">¡Hola ${userName}! 👋</div>
                <div class="message">Tu entrenador ha preparado un plan nutricional personalizado para ti.</div>
                <div class="item-info">
                  <div class="item-name">${itemName}</div>
                  <div class="trainer-info">Asignada por: ${trainerName}</div>
                </div>
                <div style="text-align: center;">
                  <a href="https://tu-app.com/dietas" class="cta-button">Ver Mi Dieta 🍎</a>
                </div>
                <div class="message">¡Una buena nutrición es clave para el éxito! 💪</div>
              </div>
              <div class="footer">
                <p>FitApp - Tu compañero de entrenamiento</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    const { data, error } = await resend.emails.send({
      from: 'FitApp <noreply@tu-dominio.com>', // Cambiar por tu dominio verificado
      to: [userEmail],
      subject,
      html,
    });

    if (error) {
      console.error('Error enviando email:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error en API de notificaciones:', error);
    return res.status(500).json({ error: error.message });
  }
}