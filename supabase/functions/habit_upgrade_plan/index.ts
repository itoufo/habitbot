// HabitLine Stripe Webhook Handler - Handle subscription events

import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';
import * as crypto from 'https://deno.land/std@0.210.0/crypto/mod.ts';
import { encodeHex } from 'https://deno.land/std@0.210.0/encoding/hex.ts';

serve(async (req: Request) => {
  try {
    const webhookSecret = Deno.env.get('HABIT_STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Missing HABIT_STRIPE_WEBHOOK_SECRET');
    }

    // Get signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get raw body
    const body = await req.text();

    // Verify signature
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse event
    const event = JSON.parse(body);
    console.log(`Received Stripe event: ${event.type}`);

    const supabase = getSupabaseClient();

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object, supabase);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in habit_upgrade_plan:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

async function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Parse signature header
  const elements = signature.split(',');
  const timestamp = elements.find((e) => e.startsWith('t='))?.split('=')[1];
  const sig = elements.find((e) => e.startsWith('v1='))?.split('=')[1];

  if (!timestamp || !sig) {
    return false;
  }

  // Create signed payload
  const signedPayload = `${timestamp}.${body}`;

  // Compute expected signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  const expectedSig = encodeHex(signatureBuffer);

  // Compare signatures
  return expectedSig === sig;
}

async function handleSubscriptionUpdate(subscription: any, supabase: any) {
  const customerId = subscription.customer;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price.id;

  // Map price ID to plan
  const plan = mapPriceToPlan(priceId);

  console.log(`Updating subscription for customer ${customerId} to plan ${plan}`);

  // Update user plan based on customer ID
  // Note: You need to store stripe_customer_id in habit_users table
  const { error } = await supabase
    .from('habit_users')
    .update({ plan })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to update user plan:', error);
    throw error;
  }

  console.log(`Successfully updated plan to ${plan} for customer ${customerId}`);
}

async function handleSubscriptionCancellation(subscription: any, supabase: any) {
  const customerId = subscription.customer;

  console.log(`Cancelling subscription for customer ${customerId}`);

  // Downgrade to free plan
  const { error } = await supabase
    .from('habit_users')
    .update({ plan: 'free' })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Failed to downgrade user plan:', error);
    throw error;
  }

  console.log(`Successfully downgraded to free plan for customer ${customerId}`);
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  const customerId = invoice.customer;
  console.log(`Payment succeeded for customer ${customerId}`);

  // Optionally: Send thank you message via LINE
  // Or update payment status in database
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  const customerId = invoice.customer;
  console.log(`Payment failed for customer ${customerId}`);

  // Optionally: Send payment reminder via LINE
  // Or update payment status in database
}

function mapPriceToPlan(priceId: string): string {
  // Map Stripe price IDs to plan names
  // These should match your actual Stripe product price IDs
  const priceMap: Record<string, string> = {
    // Example mappings - replace with your actual price IDs
    price_standard_monthly: 'standard',
    price_premium_monthly: 'premium',
    price_team_monthly: 'team',
  };

  return priceMap[priceId] || 'free';
}
