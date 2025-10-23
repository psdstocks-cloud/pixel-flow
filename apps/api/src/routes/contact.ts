import express from 'express';
import { Resend } from 'resend';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/contact', async (req, res) => {
  const { firstName, lastName, email, subject, priority, message, file } = req.body;
  
  const ticketNumber = `PF-${Date.now().toString().slice(-8)}`;
  
  try {
    // Send to support team
    await resend.emails.send({
      from: 'support@pixelflow.com',
      to: 'support@pixelflow.com',
      subject: `[${priority.toUpperCase()}] ${subject} - #${ticketNumber}`,
      html: `
        <h2>New Support Ticket #${ticketNumber}</h2>
        <p><strong>From:</strong> ${firstName} ${lastName} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });
    
    // Send confirmation to user
    await resend.emails.send({
      from: 'noreply@pixelflow.com',
      to: email,
      subject: `Support Ticket Created - #${ticketNumber}`,
      html: `
        <h2>We received your message!</h2>
        <p>Hi ${firstName},</p>
        <p>Your ticket #${ticketNumber} has been created.</p>
        <p>We'll respond within 24 hours.</p>
      `
    });
    
    res.json({ success: true, ticketNumber });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;
