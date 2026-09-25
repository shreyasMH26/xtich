# Supabase Setup — XTICH Production Backend

One-time manual setup. Do this before deploying to Render.

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in with GitHub.
2. Click **New Project**.
3. Name it `xtich`.
4. Choose any region close to your users (e.g. `ap-south-1` for India).
5. Set a strong database password and save it somewhere safe.
6. Click **Create Project** and wait ~60 seconds.

---

## Step 2 — Run the Schema

1. In your Supabase dashboard, go to **SQL Editor → New Query**.
2. Open `supabase/schema.sql` from this repo.
3. Paste the entire contents into the SQL Editor.
4. Click **Run**.
5. Verify all tables appear under **Table Editor**.

---

## Step 3 — Create the Storage Bucket

1. In the Supabase dashboard, go to **Storage**.
2. Click **New Bucket**.
3. Name: `bespoke-assets`
4. Set to **Private** (do NOT enable "Public bucket").
5. Click **Create**.

The bucket will store customer embroidery reference files. Files are never accessible publicly — the server generates signed URLs for internal use only.

---

## Step 4 — Get Your Credentials

Go to **Project Settings → API**:

| Credential | Where to find it | Render env var |
|---|---|---|
| Project URL | API Settings → Project URL | `SUPABASE_URL` |
| `service_role` secret key | API Settings → Project API keys → `service_role` | `SUPABASE_SECRET_KEY` |

> [!CAUTION]
> The `service_role` key bypasses all Row Level Security policies. It must NEVER appear in frontend code, browser DevTools, logs, or API responses. It lives only in Render environment variables and is read via `process.env.SUPABASE_SECRET_KEY`.

---

## Step 5 — Add to Render

In your [Render dashboard](https://dashboard.render.com) → `xtich-web-service` → **Environment**:

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `SUPABASE_SECRET_KEY` | `eyJhbGciOiJ...` (service_role key) |
| `RESEND_API_KEY` | *(already set)* |
| `XTICH_NOTIFICATION_EMAIL` | `xtichalt@gmail.com` *(already set)* |

Save → Render will auto-redeploy.

---

## Viewing Your Data

- **Subscribers**: Supabase dashboard → Table Editor → `subscribers`
- **Commissions**: Supabase dashboard → Table Editor → `bespoke_commissions`
- **Uploaded files**: Supabase dashboard → Storage → `bespoke-assets`

No public API endpoint exposes this data. Admin access is via the Supabase dashboard only until a proper admin UI is built.

---

## Bucket Storage Policy

After creating the `bespoke-assets` bucket, run this in the SQL Editor to ensure server-side uploads work correctly via the service_role key (which already bypasses RLS — this is belt-and-suspenders):

```sql
-- Allow service_role full access to bespoke-assets (already implicit, documented here for clarity)
-- No public access policy — bucket remains private
```

No additional policy SQL is required. The `service_role` key has full storage access by default.
