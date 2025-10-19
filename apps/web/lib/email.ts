import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null

export async function sendVerificationEmail(email: string, token: string) {
  if (!transporter) {
    console.warn('SMTP not configured. Skipping email send.')
    console.warn('Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in environment variables.')
    return
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify?token=${token}`
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pixel-flow.com'
  const fromName = process.env.SMTP_FROM_NAME || 'Pixel Flow'

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Verify your Pixel Flow account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #0070f3; font-size: 28px; font-weight: 700;">PIXEL FLOW</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Welcome to Pixel Flow!</h2>
                        <p style="margin: 0 0 24px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                          Thank you for signing up. To get started, please verify your email address by clicking the button below.
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                          <tr>
                            <td align="center">
                              <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background-color: #0070f3; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                Verify Email Address
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 24px 0 16px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 24px 0; color: #0070f3; font-size: 14px; word-break: break-all;">
                          ${verificationUrl}
                        </p>
                        
                        <!-- Info Box -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f6f9fc; border-radius: 6px; padding: 16px; margin: 24px 0;">
                          <tr>
                            <td style="padding: 16px;">
                              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                <strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 24px 0 0 0; color: #999999; font-size: 13px; line-height: 1.6;">
                          If you didn't create an account with Pixel Flow, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f6f9fc; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                        <p style="margin: 0; color: #999999; font-size: 12px; text-align: center; line-height: 1.5;">
                          © ${new Date().getFullYear()} Pixel Flow. All rights reserved.<br>
                          Stock downloads and creative tools made easy.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send verification email:', error)
    throw new Error('Failed to send verification email')
  }
}
