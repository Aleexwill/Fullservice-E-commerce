import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@fullserviceclean.com.py';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function sendInvitationEmail({
  to,
  name,
  role,
  token,
  invitedBy,
}: {
  to: string;
  name: string;
  role: string;
  token: string;
  invitedBy: string;
}) {
  const link = `${SITE_URL}/admin/invitacion/${token}`;
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    vendedor: 'Vendedor',
    tecnico: 'Técnico',
  };
  const roleLabel = roleLabels[role] || role;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Invitación — Full Service & Clean</title></head>
<body style="margin:0;padding:0;background:#0B1120;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1120;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#131B2E;border-radius:8px;border:1px solid #1A2640;overflow:hidden;">
        <tr>
          <td style="background:#1A2640;padding:24px 32px;">
            <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5E80;">Full Service & Clean</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#F4F7FB;">Panel de Administración</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#C0CEDF;line-height:1.6;">
              Hola <strong style="color:#F4F7FB;">${name || to}</strong>,
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#C0CEDF;line-height:1.6;">
              <strong style="color:#F4F7FB;">${invitedBy}</strong> te ha invitado a acceder al panel de administración de <strong style="color:#F4F7FB;">Full Service & Clean</strong> con el rol de <strong style="color:#3CAAE0;">${roleLabel}</strong>.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#C0CEDF;line-height:1.6;">
              Hacé clic en el botón de abajo para configurar tu contraseña y activar tu cuenta. El enlace vence en <strong>48 horas</strong>.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#2D8FCC;border-radius:6px;">
                  <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#F4F7FB;text-decoration:none;">
                    Activar cuenta →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:12px;color:#4A5E80;line-height:1.6;">
              Si no esperabas esta invitación, podés ignorar este email.<br>
              El enlace es válido por 48 horas desde que fue enviado.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#0B1120;padding:16px 32px;border-top:1px solid #1A2640;">
            <p style="margin:0;font-size:11px;color:#2A3A5C;">Full Service & Clean · Panel Administrativo</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Invitación al panel de administración — Full Service & Clean`,
    html,
  });
}
