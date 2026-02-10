// index.ts — Supabase Edge Function: create-payment-intent
// Deploy: supabase functions deploy create-payment-intent
// Required secret: STRIPE_SECRET_KEY

const CORS_ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type';
const CORS_ALLOW_METHODS = 'POST, OPTIONS';

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
    'Access-Control-Allow-Methods': CORS_ALLOW_METHODS,
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  if (!STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY');
    return new Response(JSON.stringify({ error: 'Stripe secret key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { amount, currency, metadata } = body ?? {};

  if (amount == null || currency == null) {
    return new Response(JSON.stringify({ error: 'amount and currency are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return new Response(JSON.stringify({ error: 'amount must be a positive number' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('amount', String(Math.round(numericAmount)));
    params.append('currency', String(currency).toLowerCase());
    params.append('automatic_payment_methods[enabled]', 'true');

    if (metadata && typeof metadata === 'object') {
      for (const [k, v] of Object.entries(metadata)) {
        params.append(`metadata[${k}]`, String(v));
      }
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await stripeRes.json().catch(() => null);

    if (!stripeRes.ok) {
      console.error('Stripe API error', data);
      return new Response(JSON.stringify({ error: data?.error?.message ?? 'Stripe API error' }), {
        status: stripeRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      clientSecret: data.client_secret,
      paymentIntentId: data.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error', err);
    return new Response(JSON.stringify({ error: err?.message ?? 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
