import { supabaseAdmin } from '../src/services/supabaseAdmin.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Add an email subscription for price change notifications
 */
async function addEmailSubscription(email, options = {}) {
  const {
    productName = null,      // null = all products
    platform = null,         // null = all platforms
    brand = 'pepe',
    notifyOnPriceDrop = true,
    notifyOnPriceIncrease = false,
    notifyOnStockChange = true,
    minPriceChangePercent = 5.00
  } = options;

  try {
    const { data, error } = await supabaseAdmin
      .from('email_subscriptions')
      .upsert({
        email,
        product_name: productName,
        platform,
        brand,
        notify_on_price_drop: notifyOnPriceDrop,
        notify_on_price_increase: notifyOnPriceIncrease,
        notify_on_stock_change: notifyOnStockChange,
        min_price_change_percent: minPriceChangePercent,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email,product_name,platform,brand'
      })
      .select();

    if (error) {
      console.error('Error adding subscription:', error);
      return null;
    }

    console.log('✅ Email subscription added:', data[0]);
    return data[0];
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const email = process.argv[2];
  const productName = process.argv[3] || null;
  const platform = process.argv[4] || null;

  if (!email) {
    console.log('Usage: node scripts/add_email_subscription.js <email> [product_name] [platform]');
    console.log('Example: node scripts/add_email_subscription.js user@example.com');
    console.log('Example: node scripts/add_email_subscription.js user@example.com "Pepe Jeans Men\'s Shorts" blinkit');
    process.exit(1);
  }

  addEmailSubscription(email, {
    productName,
    platform,
    brand: 'pepe'
  }).then(() => {
    console.log('Done!');
    process.exit(0);
  });
}

export { addEmailSubscription };


