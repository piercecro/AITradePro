# Supabase balance dashboard repair

## What changed
- Restored the intended full dashboard component to `src/pages/DashboardPage.tsx`.
- The dashboard reads `user_profiles.available_balance` and the account totals for the currently signed-in Supabase Auth user (`user.id`).
- The balance refreshes every 15 seconds and also listens for changes to that user's `user_profiles` row.
- A failed/missing profile query is shown on the dashboard instead of silently presenting a misleading `$0`.
- Login/profile creation no longer upserts zero-valued balance fields over an existing user's balance.
- Removed the fake `$42,000` chart fallback. A real zero balance now charts as zero.
- Replaced the accidental TSX-in-SQL migration with valid SQL and added a later repair migration.

## Required Supabase steps
1. Open the Supabase project connected to this site.
2. Go to **SQL Editor** and run the contents of `supabase/migrations/20261103120000_repair_user_balance_fields.sql`.
3. In **Table Editor → user_profiles**, confirm the funded user's row has `id` equal to that user's Auth UID and that `available_balance` contains the expected numeric amount.
4. Confirm `user_profiles` has RLS enabled and the authenticated SELECT policy permits `auth.uid() = id`.
5. In Vercel, confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` point to the same Supabase project. Redeploy after pushing these source changes.

## Important
This reads the balance stored in `user_profiles.available_balance`; it does not invent a balance or credit pending deposits. A deposit marked `pending` should not be treated as funded. If the money currently exists in another column/table, migrate that authoritative value into `available_balance` before relying on the dashboard. Never expose the Supabase service-role key in the browser.
