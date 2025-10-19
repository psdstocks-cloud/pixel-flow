import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendVerificationEmail(email: string, token: string) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set. Skipping email send.')
    return
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify?token=${token}`

  try {
    await resend.emails.send({
      from: 'Pixel Flow <noreply@pixel-flow.com>',
      to: email,
      subject: 'Verify your Pixel Flow account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Pixel Flow!</h1>
          <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't sign up for Pixel Flow, you can safely ignore this email.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send verification email:', error)
    throw new Error('Failed to send verification email')
  }
}
