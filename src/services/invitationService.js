import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send invitation email with invite link
 */
export async function sendInvitationEmail(email, brandName, inviteToken, inviterName) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });

  const inviteLink = `${process.env.VITE_APP_URL || 'http://localhost:3000'}/invite/${inviteToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited to PricePulse!</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${brandName}</strong> on PricePulse.</p>
          
          <p>PricePulse helps you monitor product prices across Blinkit, Swiggy, and Zepto in real-time.</p>
          
          <p style="text-align: center;">
            <a href="${inviteLink}" class="button">Accept Invitation</a>
          </p>
          
          <p style="font-size: 12px; color: #666;">
            Or copy this link: <br>
            <code style="background: #e0e0e0; padding: 5px; display: inline-block; margin-top: 5px;">${inviteLink}</code>
          </p>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <strong>What happens next?</strong><br>
            1. Click the button above to accept<br>
            2. Sign in with your Google account (${email})<br>
            3. You'll automatically get access to ${brandName}
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>PricePulse - Smart Price Tracking</p>
          <p>© ${new Date().getFullYear()} Goat Brand Labs</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SENDGRID_FROM_EMAIL,
    to: email,
    subject: `You're invited to join ${brandName} on PricePulse`,
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Invitation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    throw error;
  }
}
