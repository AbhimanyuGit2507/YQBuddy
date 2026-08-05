export function createBrandEmailLayout(options: {
  title: string;
  preheader?: string;
  headerTitle?: string;
  content: string;
}): string {
  const { title, preheader, headerTitle = 'QMOVA', content } = options;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; -webkit-font-smoothing: antialiased;">
  <!-- Preheader Text -->
  <div style="display: none; max-height: 0px; max-width: 0px; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px; color: #fff;">
    ${preheader || title}
  </div>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #09090b; padding: 32px 40px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 1.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${headerTitle}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px; text-align: left; line-height: 1.6; font-size: 16px; color: #374151;">
              ${content}
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
                <p style="margin: 0; color: #6b7280;">Warm regards,</p>
                <p style="margin: 4px 0 0 0; font-weight: 600; color: #1f2937;">The Qmova Team</p>
              </div>
            </td>
          </tr>
        </table>
        <!-- Footer Notification -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; margin-top: 24px;">
          <tr>
            <td align="center" style="font-size: 12px; color: #9ca3af; line-height: 1.5; padding: 0 20px;">
              <p style="margin: 0 0 8px 0;">This communication is intended exclusively for Qmova account holders and authorized users.</p>
              <p style="margin: 0;">&copy; ${year} Qmova. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateOtpBoxHtml(otp: string): string {
  return `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
  <tr>
    <td align="center">
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px; display: inline-block; min-width: 260px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
        <span style="font-family: monospace, Courier, sans-serif; font-size: 34px; font-weight: 700; color: #0f172a; letter-spacing: 8px;">${otp}</span>
      </div>
    </td>
  </tr>
</table>`;
}

export function generateButtonHtml(text: string, url: string = '#'): string {
  return `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
  <tr>
    <td align="center">
      <a href="${url}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 34px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">${text}</a>
    </td>
  </tr>
</table>`;
}
