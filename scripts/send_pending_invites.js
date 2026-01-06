import { supabaseAdmin } from '../src/services/supabaseAdmin.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send emails for all pending invitations
 * Use this for local testing since Vercel API routes don't work locally
 */

async function sendPendingInvites() {
  console.log('📧 Sending pending invitation emails...\n');

  try {
    // Get all pending invitations
    const { data: invitations, error } = await supabaseAdmin
      .from('invitations')
      .select(`
        *,
        brands (brand_name),
        user_profiles (full_name, email)
      `)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    if (!invitations || invitations.length === 0) {
      console.log('✅ No pending invitations to send');
      return;
    }

    console.log(`Found ${invitations.length} pending invitation(s):\n`);

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });

    // Send each invitation
    for (const invite of invitations) {
      console.log(`📨 Sending to: ${invite.email}`);
      console.log(`   Brand: ${invite.brands?.brand_name || 'Unknown'}`);
      console.log(`   Role: ${invite.role}`);
      console.log(`   Invited by: ${invite.user_profiles?.full_name || 'Admin'}`);

      const appUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
      const inviteLink = `${appUrl}/invite/${invite.token}`;

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
            code { background: #e0e0e0; padding: 5px 10px; display: inline-block; margin-top: 5px; border-radius: 3px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited to PricePulse!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p><strong>${invite.user_profiles?.full_name || 'Admin'}</strong> has invited you to join <strong>${invite.brands?.brand_name || 'a brand'}</strong> on PricePulse.</p>
              
              <p>PricePulse helps you monitor product prices across Blinkit, Swiggy, and Zepto in real-time.</p>
              
              <p style="text-align: center;">
                <a href="${inviteLink}" class="button">Accept Invitation</a>
              </p>
              
              <p style="font-size: 12px; color: #666;">
                Or copy this link:<br>
                <code>${inviteLink}</code>
              </p>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <strong>What happens next?</strong><br>
                1. Click the button above to accept<br>
                2. Sign in with your Google account (${invite.email})<br>
                3. You'll automatically get access to ${invite.brands?.brand_name || 'the brand'}
              </p>
              
              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                This invitation expires on ${new Date(invite.expires_at).toLocaleDateString()}. If you didn't expect this invitation, you can safely ignore this email.
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

      try {
        await transporter.sendMail({
          from: process.env.SENDGRID_FROM_EMAIL,
          to: invite.email,
          subject: `You're invited to join ${invite.brands?.brand_name || 'PricePulse'}`,
          html: htmlContent
        });

        console.log(`   ✅ Email sent!`);
        console.log(`   🔗 Invite link: ${inviteLink}\n`);
      } catch (emailError) {
        console.error(`   ❌ Email failed:`, emailError.message);
        console.log(`   🔗 Manual invite link: ${inviteLink}\n`);
      }
    }

    console.log('✅ All invitations processed!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

sendPendingInvites();
