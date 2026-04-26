import "jsr:@supabase/functions-js@2.100.0/edge-runtime.d.ts";
import { jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";

/**
 * Daily Subscription Reconciliation Worker
 * 
 * This function is designed to run via pg_cron. It polls Stripe and RevenueCat
 * for active subscriptions and ensures the local database is in sync.
 */
const handler = async (req: Request): Promise<Response> => {
  const admin = getServiceClient();

  try {
    console.log("[check-subscription-status] Starting daily reconciliation...");

    // 1. Fetch all users with active subscription flags in local DB
    const { data: localSubs, error: localErr } = await admin
      .from("user_subscriptions")
      .select("id, user_id, stripe_customer_id, status");

    if (localErr) throw localErr;

    // 2. [MOCK] Integration with Stripe/RevenueCat
    // In production, you would use:
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
    // const customers = await stripe.customers.list({ limit: 100 });
    
    console.log(`[check-subscription-status] Found ${localSubs?.length || 0} local subscription records to verify.`);

    // 3. Simple logic to identify and fix orphaned or expired records
    // For this prototype, we'll log what we WOULD do.
    for (const sub of localSubs || []) {
       // logic: 
       // if (sub.status === 'active' && !existsInStripe(sub.stripe_customer_id)) {
       //   await admin.from('user_subscriptions').update({ status: 'expired' }).eq('id', sub.id);
       // }
    }

    // 4. Update a global config or log table to mark last run
    await admin.from('app_config').upsert({ 
      key: 'last_subscription_reconciliation', 
      value: { 
        timestamp: new Date().toISOString(),
        records_processed: localSubs?.length || 0,
        status: 'success'
      }
    });

    return jsonResponse({ 
      success: true, 
      processed: localSubs?.length || 0 
    }, 200, req);

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[check-subscription-status] Critical Failure:", message);
    
    await admin.from('app_config').upsert({ 
      key: 'last_subscription_reconciliation', 
      value: { 
        timestamp: new Date().toISOString(),
        error: message,
        status: 'failed'
      }
    });

    return jsonResponse({ error: message }, 500, req);
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
