/*
 * One-time developer script — NOT part of the app runtime.
 *
 * Creates the 3 N2B membership Products (Basic/Pro/Business) and their
 * monthly + annual Prices in Stripe (test mode, using STRIPE_SECRET_KEY
 * from .env), then prints the resulting Price IDs to paste into .env as
 * STRIPE_PRICE_{BASIC,PRO,BUSINESS} and
 * STRIPE_PRICE_{BASIC,PRO,BUSINESS}_ANNUAL.
 *
 * Run with: npx tsx scripts/setup-stripe-products.ts
 */
import fs from 'fs';
import path from 'path';
import Stripe from 'stripe';

// No dotenv dependency in this project — load .env manually (simple
// KEY="value" lines only, matching how .env is written here).
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;

    const key = match[1];
    const value = match[2].trim().replace(/^"(.*)"$/, '$1');
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

const TIERS = [
  { key: 'BASIC', name: 'N2B Basic', monthlyCents: 3900 },
  { key: 'PRO', name: 'N2B Pro', monthlyCents: 9900 },
  { key: 'BUSINESS', name: 'N2B Business', monthlyCents: 24900 },
] as const;

async function main() {
  const envLines: string[] = [];

  for (const tier of TIERS) {
    const product = await stripe.products.create({
      name: tier.name,
      metadata: { tier: tier.key },
    });

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: tier.monthlyCents,
      recurring: { interval: 'month' },
    });

    // Annual = 10x monthly (2 months free).
    const annualPrice = await stripe.prices.create({
      product: product.id,
      currency: 'eur',
      unit_amount: tier.monthlyCents * 10,
      recurring: { interval: 'year' },
    });

    console.log(
      `${tier.key}: product=${product.id} monthly=${monthlyPrice.id} annual=${annualPrice.id}`
    );

    envLines.push(`STRIPE_PRICE_${tier.key}="${monthlyPrice.id}"`);
    envLines.push(`STRIPE_PRICE_${tier.key}_ANNUAL="${annualPrice.id}"`);
  }

  console.log('\nPaste these into .env:\n');
  console.log(envLines.join('\n'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
