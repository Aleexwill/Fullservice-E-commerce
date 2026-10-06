import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@fullserviceclean.com.py';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}
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

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Invitación al panel de administración — Full Service & Clean`,
    html,
  });
}

export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderNumber,
  items,
  total,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  items: { productName: string; quantity: number; unitPrice: number; total: number }[];
  total: number;
}) {
  if (!to) return;
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:10px 0;font-size:14px;color:#C0CEDF;border-bottom:1px solid #1A2640;">${i.productName}</td>
      <td style="padding:10px 0;font-size:14px;color:#C0CEDF;border-bottom:1px solid #1A2640;text-align:center;">${i.quantity}</td>
      <td style="padding:10px 0;font-size:14px;color:#F4F7FB;border-bottom:1px solid #1A2640;text-align:right;">Gs. ${i.total.toLocaleString('es-PY')}</td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirmación de pedido — Full Service & Clean</title></head>
<body style="margin:0;padding:0;background:#0B1120;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1120;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#131B2E;border-radius:8px;border:1px solid #1A2640;overflow:hidden;">
        <tr>
          <td style="background:#1A2640;padding:24px 32px;">
            <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5E80;">Full Service & Clean</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#F4F7FB;">Confirmación de pedido</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#C0CEDF;line-height:1.6;">Hola <strong style="color:#F4F7FB;">${customerName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;color:#C0CEDF;line-height:1.6;">Recibimos tu pedido <strong style="color:#3CAAE0;">#${orderNumber}</strong>. Nuestro equipo lo revisará y se pondrá en contacto contigo para coordinar el pago y la entrega.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <th style="padding:8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#4A5E80;text-align:left;border-bottom:1px solid #1A2640;">Producto</th>
                <th style="padding:8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#4A5E80;text-align:center;border-bottom:1px solid #1A2640;">Cant.</th>
                <th style="padding:8px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#4A5E80;text-align:right;border-bottom:1px solid #1A2640;">Total</th>
              </tr>
              ${itemRows}
              <tr>
                <td colspan="2" style="padding:14px 0 0;font-size:15px;font-weight:700;color:#F4F7FB;">Total</td>
                <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#3CAAE0;text-align:right;">Gs. ${total.toLocaleString('es-PY')}</td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#4A5E80;line-height:1.6;">¿Tenés alguna pregunta? Respondé este email o escribinos al WhatsApp.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#0B1120;padding:16px 32px;border-top:1px solid #1A2640;">
            <p style="margin:0;font-size:11px;color:#2A3A5C;">Full Service & Clean · ${SITE_URL}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Pedido #${orderNumber} recibido — Full Service & Clean`,
    html,
  });
}

export async function sendOtpEmail({
  to,
  name,
  code,
}: {
  to: string;
  name: string;
  code: string;
}) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Código de acceso — Full Service & Clean</title></head>
<body style="margin:0;padding:0;background:#0B1120;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B1120;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#131B2E;border-radius:8px;border:1px solid #1A2640;overflow:hidden;">
        <tr>
          <td style="background:#1A2640;padding:24px 32px;">
            <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#4A5E80;">Full Service &amp; Clean</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#F4F7FB;">Código de acceso</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#C0CEDF;line-height:1.6;">
              Hola <strong style="color:#F4F7FB;">${name || to}</strong>,
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#C0CEDF;line-height:1.6;">
              Tu código de acceso al panel administrativo es:
            </p>
            <div style="text-align:center;margin:0 0 28px;">
              <span style="display:inline-block;padding:18px 36px;background:#0B1120;border:2px solid #2D8FCC;border-radius:12px;font-size:36px;font-weight:700;letter-spacing:0.25em;color:#3CAAE0;font-family:'Courier New',monospace;">${code}</span>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#4A5E80;line-height:1.6;">
              Este código vence en <strong style="color:#C0CEDF;">10 minutos</strong>.
            </p>
            <p style="margin:0;font-size:13px;color:#4A5E80;line-height:1.6;">
              Si no solicitaste este código, ignorá este email — tu cuenta sigue segura.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#0B1120;padding:16px 32px;border-top:1px solid #1A2640;">
            <p style="margin:0;font-size:11px;color:#2A3A5C;">Full Service &amp; Clean · Panel Administrativo</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${code} — Tu código de acceso al panel`,
    html,
  });
}

export async function sendCustomerActivationEmail({
  to,
  customerName,
  activationToken,
}: {
  to: string;
  customerName: string;
  activationToken: string;
}) {
  const link = `${SITE_URL}/cuenta/activar?token=${activationToken}`;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F4F7FB;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" style="max-width:560px;background:#FFFFFF;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#0B1120;padding:24px 32px;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#F4F7FB;letter-spacing:0.05em;">Full Service & Clean</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0B1120;">Activá tu cuenta</h1>
            <p style="margin:0 0 20px;font-size:14px;color:#4A5E80;line-height:1.6;">Hola ${customerName}, gracias por tu pedido. Hacé clic en el botón para crear tu contraseña y acceder a tus pedidos en cualquier momento.</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#F4F7FB;text-decoration:none;background:#1A3A5C;border-radius:6px;">Activar cuenta →</a>
            </div>
            <p style="margin:0;font-size:12px;color:#8094B4;">El enlace vence en 48 horas. Si no hiciste ningún pedido, ignorá este email.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#0B1120;padding:16px 32px;">
            <p style="margin:0;font-size:11px;color:#2A3A5C;">Full Service & Clean · ${SITE_URL}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Activá tu cuenta — Full Service & Clean',
    html,
  });
}
