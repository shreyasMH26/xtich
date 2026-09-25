/**
 * XTICH Digital Atelier — Production Server
 *
 * Architecture:
 *   XTICH frontend (Vite/static)
 *     → Render Node/Express (this file)
 *     → Supabase PostgreSQL  (subscribers, commissions, assets, events)
 *     → Supabase Storage     (bespoke-assets — private bucket)
 *     → Resend               (email notifications → xtichalt@gmail.com)
 *
 * Security contract:
 *   - SUPABASE_SECRET_KEY  → server only, never in browser, never in logs
 *   - RESEND_API_KEY       → server only, never in browser, never in logs
 *   - No stack traces or env var names in API error responses
 *   - No public endpoint exposes customer emails or commission records
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Environment — load .env locally (Render injects env vars directly)
// ---------------------------------------------------------------------------
try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(path.join(__dirname, '.env'))) {
    process.loadEnvFile(path.join(__dirname, '.env'));
  }
} catch (_) {}

const PORT               = process.env.PORT || 3000;
const NOTIFICATION_EMAIL = process.env.XTICH_NOTIFICATION_EMAIL || 'xtichalt@gmail.com';
const FROM_ADDRESS       = process.env.RESEND_FROM_EMAIL || 'XTICH Atelier <onboarding@resend.dev>';
const BESPOKE_BUCKET     = 'bespoke-assets';

// ---------------------------------------------------------------------------
// Supabase — service_role client (bypasses RLS, server-side only)
// The variable name on Render is SUPABASE_SECRET_KEY.
// ---------------------------------------------------------------------------
let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  console.log('[Supabase] Client initialised with service_role key.');
} else {
  console.warn('[Supabase] SUPABASE_URL or SUPABASE_SECRET_KEY not set.');
  console.warn('[Supabase] Subscription and bespoke endpoints will return 503 until credentials are configured on Render.');
}

/** Throws HTTP 503 if Supabase is not configured. Returns the client. */
function requireSupabase() {
  if (!supabase) {
    const err = new Error('Database not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in Render environment.');
    err.status = 503;
    throw err;
  }
  return supabase;
}

// ---------------------------------------------------------------------------
// Resend client factory
// ---------------------------------------------------------------------------
function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// Strict JSON body limit
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ---------------------------------------------------------------------------
// Rate limiting — public mutation endpoints only
// ---------------------------------------------------------------------------
const subscribeLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

const bespokeLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many commission submissions. Please try again later.' }
});

// ---------------------------------------------------------------------------
// Multer — memory-only storage (files uploaded to Supabase Storage, not disk)
// ---------------------------------------------------------------------------
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_EXT  = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
const MAX_FILE_MB  = 10;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (ALLOWED_MIME.has(mime) && ALLOWED_EXT.has(ext)) {
      return cb(null, true);
    }
    cb(new Error(`Invalid file type. Allowed: JPG, PNG, WEBP, PDF (max ${MAX_FILE_MB}MB).`));
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

/** Generate an unambiguous random reference suffix (no 0/O/1/I confusion). */
function generateReference() {
  const chars  = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix   = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `XT-${new Date().getFullYear()}-${suffix}`;
}

/**
 * Upload buffer to the private bespoke-assets Supabase Storage bucket.
 * Returns the storage path (key) inside the bucket.
 */
async function uploadToStorage(db, buffer, originalname, mimetype) {
  const safeName    = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `commissions/${Date.now()}_${safeName}`;

  const { error } = await db.storage
    .from(BESPOKE_BUCKET)
    .upload(storagePath, buffer, { contentType: mimetype, upsert: false });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
  return storagePath;
}

/**
 * Generate a 1-hour signed URL for a private storage file.
 * Used in email notifications only — never returned in API responses.
 */
async function getSignedUrl(db, storagePath, expiresInSeconds = 3600) {
  const { data, error } = await db.storage
    .from(BESPOKE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) return null;
  return data?.signedUrl || null;
}

/**
 * Append a row to site_events — non-blocking, never interrupts main flow.
 */
async function logEvent(db, eventType, email, metadata = {}) {
  try {
    const { error } = await db
      .from('site_events')
      .insert({ event_type: eventType, email, metadata });
    if (error) {
      console.warn(`[Supabase] site_events insert warning (${eventType}):`, error.message);
    }
  } catch (e) {
    console.warn('[Supabase] site_events exception (non-fatal):', e.message);
  }
}

// ---------------------------------------------------------------------------
// Email: subscriber allocation notification
// ---------------------------------------------------------------------------
async function sendAllocationNotification(email) {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[Resend] RESEND_API_KEY not set — skipping subscriber notification for ${email}.`);
    return { success: true, simulated: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to:   [NOTIFICATION_EMAIL],
      subject: `[XTICH Allocation] New Priority Subscriber: ${email}`,
      html: `
        <div style="font-family:monospace;background:#0c0c0d;color:#fbfaf6;padding:32px;border-radius:6px;">
          <h2 style="color:#fff;letter-spacing:0.1em;text-transform:uppercase;">New Priority Allocation Subscriber</h2>
          <p style="font-size:16px;margin:16px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color:#4ade80;">${email}</a></p>
          <p style="font-size:13px;color:#888;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p style="font-size:13px;color:#888;"><strong>Source:</strong> Hero Drop Bar (Built for the curious)</p>
          <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;" />
          <p style="font-size:11px;color:#666;">XTICH DIGITAL ATELIER · PRIORITY SUBSCRIBER ALERT</p>
        </div>
      `
    });

    if (error) {
      console.error('[Resend] Allocation notification error:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] Allocation notification delivered to ${NOTIFICATION_EMAIL}`);
    return { success: true };
  } catch (err) {
    console.error('[Resend] Allocation notification exception:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Email: bespoke commission notification
// ---------------------------------------------------------------------------
async function sendBespokeNotification(data, signedFileUrl) {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[Resend] RESEND_API_KEY not set — skipping bespoke notification for ${data.reference}.`);
    return { success: true, simulated: true };
  }

  const fileRow = signedFileUrl
    ? `<div class="row"><span class="label">Uploaded Reference</span><span class="value"><a href="${signedFileUrl}" target="_blank" rel="noopener noreferrer">${data.originalFilename || 'View File'}</a></span></div>`
    : `<div class="row"><span class="label">Uploaded Reference</span><span class="value">None</span></div>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0c0c0d;color:#fbfaf6;padding:32px 16px;margin:0;}
  .card{max-width:620px;margin:0 auto;background:#121214;border:1px solid rgba(255,255,255,0.12);padding:36px 32px;border-radius:4px;}
  .tag{font-family:monospace;font-size:11px;letter-spacing:0.16em;color:#888;text-transform:uppercase;margin-bottom:12px;}
  h1{font-size:24px;font-weight:800;margin:0 0 18px;letter-spacing:-0.02em;color:#fbfaf6;}
  .ref-strip{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);padding:12px 16px;font-family:monospace;font-size:14px;margin-bottom:24px;color:#fff;font-weight:bold;letter-spacing:0.06em;}
  .row{display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06);padding:10px 0;font-size:13px;}
  .label{color:#888;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;}
  .value{color:#fbfaf6;font-weight:600;text-align:right;}
  .instructions-wrap{margin-top:24px;}
  .instructions-box{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:16px;font-size:13px;line-height:1.5;color:#e5e5e5;margin-top:8px;white-space:pre-wrap;}
  .footer{margin-top:36px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.08);font-family:monospace;font-size:11px;color:#666;text-align:center;letter-spacing:0.1em;}
  a{color:#fbfaf6;}
</style></head>
<body>
  <div class="card">
    <div class="tag">XTICH / BESPOKE ATELIER COMMISSION</div>
    <h1>New Custom Piece Request</h1>
    <div class="ref-strip">${data.reference}</div>
    <div class="row"><span class="label">Customer Name</span><span class="value">${data.name}</span></div>
    <div class="row"><span class="label">Customer Email</span><span class="value">${data.email}</span></div>
    <div class="row"><span class="label">Base Garment</span><span class="value">Heavyweight 450 GSM Hoodie</span></div>
    <div class="row"><span class="label">Hoodie Color</span><span class="value">${data.hoodieColorCode} (${data.hoodieColorHex})</span></div>
    <div class="row"><span class="label">Garment Size</span><span class="value">${data.size}</span></div>
    <div class="row"><span class="label">Quantity</span><span class="value">${data.quantity} Unit(s)</span></div>
    <div class="row"><span class="label">Embroidery Type</span><span class="value">${data.embroideryType}</span></div>
    <div class="row"><span class="label">Placement</span><span class="value">${data.placement}</span></div>
    <div class="row"><span class="label">Embroidery Mark / Text</span><span class="value">"${data.embroideryText}"</span></div>
    <div class="row"><span class="label">Embroidery Scale</span><span class="value">${data.scale}</span></div>
    <div class="row"><span class="label">Thread Tone</span><span class="value">${data.thread}</span></div>
    <div class="row"><span class="label">Timestamp</span><span class="value">${data.timestamp}</span></div>
    ${fileRow}
    <div class="instructions-wrap">
      <div class="label">Custom Instructions</div>
      <div class="instructions-box">${data.customInstructions || 'No additional instructions.'}</div>
    </div>
    <div class="footer">XTICH DIGITAL ATELIER · ARCHITECTURAL BESPOKE DISPATCH</div>
  </div>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from:    FROM_ADDRESS,
      to:      [NOTIFICATION_EMAIL],
      subject: `[XTICH Bespoke] Commission ${data.reference} — ${data.name}`,
      html
    });

    if (error) {
      console.error('[Resend] Bespoke notification error:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] Bespoke notification delivered for ${data.reference}`);
    return { success: true };
  } catch (err) {
    console.error('[Resend] Bespoke notification exception:', err.message);
    return { success: false, error: err.message };
  }
}

// ===========================================================================
// API Routes
// ===========================================================================

// ---------------------------------------------------------------------------
// POST /api/subscribe
// ---------------------------------------------------------------------------
app.post('/api/subscribe', subscribeLimit, async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const db         = requireSupabase();
    const cleanEmail = email.trim().toLowerCase();

    const { error: insertError } = await db
      .from('subscribers')
      .insert({ email: cleanEmail, source: 'hero_allocation_bar' });

    let isNew = true;
    if (insertError) {
      if (insertError.code === '23505') {
        isNew = false; // duplicate — not an error
      } else {
        console.error('[Supabase] Subscriber insert error:', insertError.message, insertError.code);
        const err = new Error('Failed to record subscription.');
        err.status = 500;
        throw err;
      }
    }

    logEvent(db, isNew ? 'subscriber.new' : 'subscriber.duplicate', cleanEmail, {
      source: 'hero_allocation_bar'
    });

    const notificationResult = await sendAllocationNotification(cleanEmail);

    return res.status(200).json({
      success:  true,
      message:  isNew ? 'Priority allocation confirmed.' : 'Already on the priority list.',
      email:    cleanEmail,
      notified: Boolean(notificationResult?.success && !notificationResult?.simulated)
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/bespoke
// ---------------------------------------------------------------------------
app.post('/api/bespoke', bespokeLimit, (req, res, next) => {
  // multer parses the multipart body — req.body only populated after this runs
  upload.single('referenceFile')(req, res, async (uploadErr) => {
    if (uploadErr) {
      if (uploadErr.code === 'LIMIT_FILE_SIZE') {
        console.error('[API /api/bespoke] File rejected — too large:', uploadErr.message);
        return res.status(400).json({ error: `File too large. Maximum size is ${MAX_FILE_MB}MB.` });
      }
      console.error('[API /api/bespoke] Multer error:', uploadErr.message);
      return res.status(400).json({ error: uploadErr.message });
    }

    // Log what keys multer actually parsed — helps diagnose empty-body issues
    const bodyKeys = Object.keys(req.body || {});
    console.log('[API /api/bespoke] Submission received. Body keys:', bodyKeys.length ? bodyKeys.join(', ') : '(none)');

    try {
      // Destructure with explicit String() coercion so undefined fields don't
      // cause .trim() / .toUpperCase() to throw later in the pipeline.
      const body = req.body || {};
      const name               = body.name;
      const email              = body.email;
      const hoodieColor        = body.hoodieColor        || 'Obsidian';
      const hoodieColorCode    = body.hoodieColorCode    || '01 / OBSIDIAN';
      const hoodieColorHex     = body.hoodieColorHex     || '#0A0A0A';
      const size               = body.size               || 'M';
      const quantity           = body.quantity           || '1';
      const embroideryType     = body.embroideryType     || 'TEXT';
      const embroideryPlacement= body.embroideryPlacement|| 'CHEST';
      const embroideryText     = body.embroideryText     || 'XTICH';
      const embroideryScale    = body.embroideryScale    || 'SMALL';
      const thread             = body.thread             || 'WHITE';
      const customInstructions = body.customInstructions || '';

      // -----------------------------------------------------------------------
      // Validation
      // -----------------------------------------------------------------------
      if (!name || String(name).trim().length < 2) {
        console.error('[API /api/bespoke] Validation FAILED — name:', JSON.stringify(name));
        return res.status(400).json({ error: 'Customer name must be at least 2 characters.' });
      }
      if (!isValidEmail(email)) {
        console.error('[API /api/bespoke] Validation FAILED — email:', JSON.stringify(email));
        return res.status(400).json({ error: 'Valid customer email is required.' });
      }

      const parsedQty = parseInt(quantity, 10);
      if (isNaN(parsedQty) || parsedQty < 1 || parsedQty > 100) {
        console.error('[API /api/bespoke] Validation FAILED — quantity:', JSON.stringify(quantity));
        return res.status(400).json({ error: 'Quantity must be between 1 and 100.' });
      }

      // -----------------------------------------------------------------------
      // Supabase client
      // -----------------------------------------------------------------------
      const db = requireSupabase();

      // Generate canonical commission reference (always server-generated)
      const reference = generateReference();
      console.log(`[API /api/bespoke] Reference: ${reference} | email: ${String(email).trim()} | name: ${String(name).trim()}`);

      // -----------------------------------------------------------------------
      // Step 1: Upload reference file to Supabase Storage (if provided)
      // -----------------------------------------------------------------------
      let storagePath      = null;
      let originalFilename = null;

      if (req.file) {
        console.log(`[Supabase] Uploading asset: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);
        try {
          originalFilename = req.file.originalname;
          storagePath      = await uploadToStorage(db, req.file.buffer, req.file.originalname, req.file.mimetype);
          console.log(`[Supabase] Asset uploaded: ${storagePath}`);
        } catch (storageErr) {
          // Storage failure is fatal — don't create an orphan commission without the declared asset
          console.error('[Supabase] Storage upload FAILED:', storageErr.message);
          const err  = new Error('Failed to upload reference file. Please try again.');
          err.status = 500;
          throw err;
        }
      } else {
        console.log('[API /api/bespoke] No reference file attached.');
      }

      // -----------------------------------------------------------------------
      // Step 2: Insert bespoke_commissions row
      // -----------------------------------------------------------------------
      console.log('[Supabase] Creating commission record...');

      const { data: commissionRow, error: commissionError } = await db
        .from('bespoke_commissions')
        .insert({
          reference,
          email:               String(email).trim(),
          name:                String(name).trim(),
          hoodie_color:        String(hoodieColor).trim(),
          hoodie_color_code:   String(hoodieColorCode).trim(),
          hoodie_color_hex:    String(hoodieColorHex).trim(),
          embroidery_type:     String(embroideryType).toUpperCase(),
          embroidery_text:     String(embroideryText).trim() || 'XTICH',
          placement:           String(embroideryPlacement).toUpperCase(),
          scale:               String(embroideryScale).toUpperCase(),
          thread:              String(thread).toUpperCase(),
          size:                String(size).toUpperCase(),
          quantity:            parsedQty,
          custom_instructions: String(customInstructions).trim().substring(0, 2000),
          status:              'pending'
        })
        .select('id')
        .single();

      if (commissionError) {
        console.error('[Supabase] Commission insert FAILED.');
        console.error('[Supabase]   code   :', commissionError.code);
        console.error('[Supabase]   message:', commissionError.message);
        console.error('[Supabase]   details:', commissionError.details);
        console.error('[Supabase]   hint   :', commissionError.hint);

        if (storagePath) {
          logEvent(db, 'commission.insert_failed_after_upload', String(email).trim(), {
            reference, storagePath, supabase_error: commissionError.message
          });
        }

        const err  = new Error('Failed to save commission. Please try again.');
        err.status = 500;
        throw err;
      }

      console.log(`[Supabase] Commission created: ${reference} (id: ${commissionRow?.id})`);

      // -----------------------------------------------------------------------
      // Step 3: Insert commission_assets row (if file was uploaded)
      // -----------------------------------------------------------------------
      if (storagePath && commissionRow?.id) {
        console.log('[Supabase] Creating asset metadata record...');
        const { error: assetError } = await db
          .from('commission_assets')
          .insert({
            commission_id:     commissionRow.id,
            storage_path:      storagePath,
            original_filename: originalFilename,
            mime_type:         req.file.mimetype,
            file_size:         req.file.size
          });

        if (assetError) {
          // Non-fatal — commission row is already saved
          console.error('[Supabase] Asset metadata insert FAILED:', assetError.message, assetError.code);
          logEvent(db, 'asset.metadata_failed', String(email).trim(), {
            reference, storagePath, supabase_error: assetError.message
          });
        } else {
          console.log('[Supabase] Asset metadata created.');
        }
      }

      // -----------------------------------------------------------------------
      // Step 4: Log site_events row
      // -----------------------------------------------------------------------
      console.log('[Supabase] Logging site event...');
      await logEvent(db, 'commission.submitted', String(email).trim(), {
        reference,
        has_file: Boolean(storagePath),
        size:     String(size).toUpperCase(),
        quantity: parsedQty
      });
      console.log('[Supabase] Site event created.');

      // -----------------------------------------------------------------------
      // Step 5: Send Resend notification (fire-and-forget — commission is already saved)
      // -----------------------------------------------------------------------
      const signedUrl = storagePath ? await getSignedUrl(db, storagePath) : null;

      sendBespokeNotification({
        reference,
        name:               String(name).trim(),
        email:              String(email).trim(),
        hoodieColorCode:    String(hoodieColorCode).trim(),
        hoodieColorHex:     String(hoodieColorHex).trim(),
        embroideryType:     String(embroideryType).toUpperCase(),
        embroideryText:     String(embroideryText).trim() || 'XTICH',
        placement:          String(embroideryPlacement).toUpperCase(),
        scale:              String(embroideryScale).toUpperCase(),
        thread:             String(thread).toUpperCase(),
        size:               String(size).toUpperCase(),
        quantity:           parsedQty,
        customInstructions: String(customInstructions).trim().substring(0, 2000),
        originalFilename,
        timestamp:          new Date().toISOString()
      }, signedUrl).catch(err => {
        console.error('[Resend] Bespoke notification failed (commission is saved, non-fatal):', err.message);
      });

      console.log(`[API /api/bespoke] Commission ${reference} pipeline complete.`);

      return res.status(200).json({
        success:   true,
        reference,
        message:   'Bespoke commission lodged successfully.'
      });

    } catch (err) {
      next(err);
    }
  });
});

// ---------------------------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'not_configured';

  if (supabase) {
    try {
      const { error } = await supabase
        .from('subscribers')
        .select('id', { count: 'exact', head: true });
      dbStatus = error ? 'degraded' : 'connected';
    } catch (_) {
      dbStatus = 'degraded';
    }
  }

  return res.status(200).json({
    ok:        true,
    service:   'xtich-atelier',
    database:  dbStatus,
    port:      String(PORT),
    timestamp: new Date().toISOString()
  });
});

// ---------------------------------------------------------------------------
// Centralized error handler — MUST be after all routes
// Never expose stack traces, env var names, or internal details in responses.
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status  = err.status || 500;
  const isKnown = status < 500;

  if (!isKnown) {
    console.error('[Server Error]', err.message);
  }

  res.status(status).json({
    error: isKnown ? err.message : 'An unexpected error occurred. Please try again.'
  });
});

// ===========================================================================
// Static File Serving (Vite dist/ + SPA fallback)
// ===========================================================================

// Block direct access to sensitive server-side files
app.use((req, _res, next) => {
  const p = req.path.toLowerCase();
  if (
    p.includes('.env')            ||
    p.includes('server.js')       ||
    p.includes('subscribers.json')||
    p.includes('package.json')    ||
    p.includes('supabase')
  ) {
    const err  = new Error('Access forbidden.');
    err.status = 403;
    return next(err);
  }
  next();
});

const distDir   = path.resolve(__dirname, 'dist');
const publicDir = path.resolve(__dirname, 'public');

function serveIndex(_req, res) {
  const distIndex = path.resolve(distDir, 'index.html');
  const rootIndex = path.resolve(__dirname, 'index.html');
  const target    = fs.existsSync(distIndex) ? distIndex : rootIndex;

  if (!fs.existsSync(target)) {
    console.error('[Server] index.html not found. Run npm run build.');
    return res.status(500).send('Production build not found. Run npm run build.');
  }

  res.sendFile(target, { dotfiles: 'allow' }, (err) => {
    if (err && !res.headersSent) {
      console.warn('[Server] sendFile fallback — streaming:', err.message);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      fs.createReadStream(target).pipe(res);
    }
  });
}

if (fs.existsSync(distDir)) {
  console.log(`[Server] Production mode: serving from ${distDir}`);
  app.use(express.static(distDir, { dotfiles: 'allow', index: false }));
  app.use('/assets', express.static(path.resolve(distDir, 'assets'), { dotfiles: 'allow' }));
} else {
  console.log('[Server] Development mode: serving from root.');
  app.use(express.static(__dirname, { dotfiles: 'allow', index: false }));
}

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { dotfiles: 'allow', index: false }));
}
app.use('/assets', express.static(path.resolve(__dirname, 'assets'), { dotfiles: 'allow' }));

// Explicit root route
app.get('/', (req, res) => serveIndex(req, res));

// SPA catch-all — must be after all API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: `API endpoint '${req.path}' not found.` });
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveIndex(req, res);
  }
  next();
});

// ===========================================================================
// Listen
// ===========================================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`XTICH Digital Atelier running on 0.0.0.0:${PORT}`);
});
