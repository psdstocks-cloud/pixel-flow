# Email Setup Guide (Nodemailer + Gmail)

## 🚀 Quick Setup with Gmail

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Go to **Security** → **2-Step Verification**
2. Scroll down to **App passwords**
3. Click **Select app** → Choose **Mail**
4. Click **Select device** → Choose **Other (Custom name)**
5. Enter "Pixel Flow" and click **Generate**
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Configure Environment Variables

#### For Vercel (Production):
Add these to your Vercel project settings:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=Pixel Flow
```

#### For Local Development:
Update your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=your-email@gmail.com
SMTP_FROM_NAME=Pixel Flow
```

---

## 📧 Alternative SMTP Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

---

## 🔧 Testing Email Locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Try signing up with your email
# Check your inbox (including spam folder)
```

---

## ⚠️ Important Notes

1. **Gmail Limits**: Gmail allows ~500 emails/day for free accounts
2. **App Passwords**: Never use your main Gmail password - always use App Passwords
3. **Security**: Never commit `.env` files to version control
4. **Spam Folder**: First emails might land in spam - mark as "Not Spam"
5. **Production**: Consider using a dedicated email service (SendGrid, Mailgun) for production

---

## 🐛 Troubleshooting

### "Invalid login" error
- Make sure 2FA is enabled
- Use an App Password, not your regular password
- Remove spaces from the app password

### Emails not sending
- Check Vercel logs for errors
- Verify SMTP credentials are correct
- Check Gmail "Less secure app access" settings

### Emails going to spam
- Set up SPF and DKIM records for your domain
- Use a verified sending domain
- Warm up your email sender reputation gradually

---

## 📚 Resources

- [Gmail App Passwords Guide](https://support.google.com/accounts/answer/185833)
- [Nodemailer Documentation](https://nodemailer.com/)
- [SMTP Testing Tool](https://www.smtper.net/)
