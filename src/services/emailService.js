import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { supabaseAdmin } from './supabaseAdmin.js';

dotenv.config();

/**
 * Create email transporter
 */
function createTransporter() {
  // Option 1: SendGrid (recommended)
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // Option 2: Gmail (requires app password)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // App password, not regular password
      }
    });
  }

  // Option 3: SMTP (works with any email provider)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  throw new Error('Email configuration not found. Please set SENDGRID_API_KEY, EMAIL_SERVICE, or SMTP_HOST in .env');
}

/**
 * Format price change email
 */
function formatPriceChangeEmail(changes) {
  if (changes.length === 0) {
    return null;
  }

  const platformEmojis = {
    blinkit: '🟡',
    swiggy: '🟢',
    zepto: '🔵'
  };

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .product { background: white; margin: 15px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5; }
        .product-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .price-change { font-size: 16px; margin: 5px 0; }
        .price-increase { color: #dc2626; }
        .price-decrease { color: #16a34a; }
        .stock-change { color: #ea580c; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Price Pulse - Price Change Alert</h1>
          <p>${changes.length} product(s) have price or stock changes</p>
        </div>
        <div class="content">
  `;

  changes.forEach(change => {
    const emoji = platformEmojis[change.platform] || '📦';
    const priceChangeClass = change.price_change > 0 ? 'price-increase' : 'price-decrease';
    const priceChangeSymbol = change.price_change > 0 ? '↑' : '↓';
    
    html += `
      <div class="product">
        <div class="product-name">${emoji} ${change.name}</div>
        <div><strong>Platform:</strong> ${change.platform.toUpperCase()}</div>
        
        <div class="price-change ${priceChangeClass}">
          <strong>Price Change:</strong> 
          ₹${change.previous_price.toFixed(2)} → ₹${change.current_price.toFixed(2)} 
          (${priceChangeSymbol} ₹${Math.abs(change.price_change).toFixed(2)} | ${Math.abs(change.price_change_percent).toFixed(2)}%)
        </div>
    `;

    if (change.stock_changed) {
      html += `
        <div class="stock-change">
          <strong>Stock Status Changed:</strong> 
          ${change.previous_stock || 'Unknown'} → ${change.current_stock || 'Unknown'}
        </div>
      `;
    }

    html += `</div>`;
  });

  html += `
        </div>
        <div class="footer">
          <p>This is an automated email from Price Pulse monitoring system.</p>
          <p>Generated at ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Send price change notification email
 */
export async function sendPriceChangeEmail(changes, recipientEmail) {
  if (!changes || changes.length === 0) {
    console.log('No price changes to notify');
    return;
  }

  if (!recipientEmail) {
    console.error('Recipient email not provided');
    return;
  }

  try {
    const transporter = createTransporter();
    const html = formatPriceChangeEmail(changes);

    if (!html) {
      return;
    }

    // Determine sender email
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || 'noreply@pricepulse.com';
    
    const mailOptions = {
      from: `"Price Pulse" <${fromEmail}>`,
      to: recipientEmail,
      subject: `Price Change Alert: ${changes.length} Product(s) Updated`,
      html: html,
      text: `Price changes detected for ${changes.length} product(s). Please view in HTML format.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Price change email sent to ${recipientEmail}:`, info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending price change email:', error);
    throw error;
  }
}

/**
 * Send price change notifications to all subscribers
 */
export async function notifyPriceChanges(changes, brand = 'pepe') {
  if (!changes || changes.length === 0) {
    return;
  }

  try {
    // Get all email subscriptions for this brand
    const { data: subscriptions, error } = await supabaseAdmin
      .from('email_subscriptions')
      .select('*')
      .eq('brand', brand);

    if (error) {
      console.error('Error fetching email subscriptions:', error);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No email subscriptions found');
      return;
    }

    // Filter changes based on subscription preferences
    for (const subscription of subscriptions) {
      const relevantChanges = changes.filter(change => {
        // Filter by product name if specified
        if (subscription.product_name && 
            change.name.toLowerCase() !== subscription.product_name.toLowerCase()) {
          return false;
        }

        // Filter by platform if specified
        if (subscription.platform && change.platform !== subscription.platform) {
          return false;
        }

        // Check notification preferences
        if (change.price_change > 0 && !subscription.notify_on_price_increase) {
          return false;
        }

        if (change.price_change < 0 && !subscription.notify_on_price_drop) {
          return false;
        }

        if (change.stock_changed && !subscription.notify_on_stock_change) {
          return false;
        }

        // Check minimum price change percent
        if (Math.abs(change.price_change_percent) < subscription.min_price_change_percent) {
          return false;
        }

        return true;
      });

      if (relevantChanges.length > 0) {
        await sendPriceChangeEmail(relevantChanges, subscription.email);
      }
    }
  } catch (error) {
    console.error('Error notifying price changes:', error);
  }
}


