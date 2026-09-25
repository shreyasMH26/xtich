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

const PORT                   = process.env.PORT || 3000;
const NOTIFICATION_EMAIL     = process.env.XTICH_NOTIFICATION_EMAIL || 'xtichalt@gmail.com';
const FROM_ADDRESS           = process.env.RESEND_FROM_EMAIL || 'XTICH Atelier <onboarding@resend.dev>';
const BESPOKE_BUCKET         = 'bespoke-assets';

// ---------------------------------------------------------------------------
// Supabase — service_role client (bypasses RLS, server-side only)
// ---------------------------------------------------------------------------
let supabase = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  console.log('[Supabase] Client initialised with service_role key.');
} else {
  console.warn('[Supabase] SUPABASE_URL or SUPABASE_SECRET_KEY not set.');
  console.warn('[Supabase] API endpoints will return 503 until credentials are configured.');
}

/**
 * Returns true if Supabase is configured. Throws if not in production.
 */
function requireSupabase() {
  if (!supabase) {
    const err = new Error('Database not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY in environment.');
    err.status = 503;
    throw err;
  }
  return supabase;
}

// ---------------------------------------------------------------------------
// Resend — email notification client
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

// Strict request body limits — prevent JSON payload abuse
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ---------------------------------------------------------------------------
// Rate limiting — applied to public mutation endpoints only
// ---------------------------------------------------------------------------
const subscribeLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
  skipSuccessfulRequests: false
});

const bespokeLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many commission submissions. Please try again later.' }
});

// ---------------------------------------------------------------------------
// Multer — in-memory only (files go to Supabase Storage, not disk)
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

/** Validate email format */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

/**
 * Upload file buffer to Supabase Storage (private bespoke-assets bucket).
 * Returns the storage path (key) inside the bucket.
 */
async function uploadToStorage(db, buffer, originalname, mimetype) {
  const safeName  = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `commissions/${Date.now()}_${safeName}`;

  const { error } = await db.storage
    .from(BESPOKE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimetype,
      upsert: false
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return storagePath;
}

/**
 * Generate a signed URL for a private storage file (valid 1 hour).
 * Used in email notifications only — never exposed in API responses.
 */
async function getSignedUrl(db, storagePath, expiresInSeconds = 3600) {
  const { data, error } = await db.storage
    .from(BESPOKE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) return null;
  return data?.signedUrl || null;
}

/**
 * Log a site event — non-blocking, failure never interrupts main flow.
 */
async function logEvent(db, eventType, email, metadata = {}) {
  try {
    await db.from('site_events').insert({ event_type: eventType, email, metadata });
  } catch (_) {
    // Event logging is best-effort
  }
}

// ---------------------------------------------------------------------------
// Email: Allocation subscriber notification
// ---------------------------------------------------------------------------
async function sendAllocationNotification(email) {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[Resend] RESEND_API_KEY not set. Skipping notification for ${email}.`);
    return { success: true, simulated: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [NOTIFICATION_EMAIL],
      subject: `[XTICH Allocation] New Priority Subscriber: ${email}`,
      html: `
        <div style="font-family: monospace; background: #0c0c0d; color: #fbfaf6; padding: 32px; border-radius: 6px;">
          <h2 style="color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase;">New Priority Allocation Subscriber</h2>
          <p style="font-size: 16px; margin: 16px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #4ade80;">${email}</a></p>
          <p style="font-size: 13px; color: #888;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p style="font-size: 13px; color: #888;"><strong>Source:</strong> Hero Drop Bar (Built for the curious)</p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
          <p style="font-size: 11px; color: #666;">XTICH DIGITAL ATELIER · PRIORITY SUBSCRIBER ALERT</p>
        </div>
      `
    });

    if (error) {
      console.error('[Resend] Allocation email error:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] Allocation notification delivered to ${NOTIFICATION_EMAIL}`);
    return { success: true };
  } catch (err) {
    console.error('[Resend] Allocation email exception:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Email: Bespoke commission notification
// ---------------------------------------------------------------------------
async function sendBespokeNotification(data, signedFileUrl) {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`[Resend] RESEND_API_KEY not set. Skipping bespoke notification for ${data.reference}.`);
    return { success: true, simulated: true };
  }

  const fileRow = signedFileUrl
    ? `<div class="row"><span class="label">Uploaded Reference</span><span class="value"><a href="${signedFileUrl}" target="_blank" rel="noopener noreferrer">${data.originalFilename || 'View File'}</a></span></div>`
    : `<div class="row"><span class="label">Uploaded Reference</span><span class="value">None</span></div>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0c0d; color: #fbfaf6; padding: 32px 16px; margin: 0; }
        .card { max-width: 620px; margin: 0 auto; background: #121214; border: 1px solid rgba(255,255,255,0.12); padding: 36px 32px; border-radius: 4px; }
        .tag { font-family: monospace; font-size: 11px; letter-spacing: 0.16em; color: #888; text-transform: uppercase; margin-bottom: 12px; }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 18px; letter-spacing: -0.02em; color: #fbfaf6; }
        .ref-strip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); padding: 12px 16px; font-family: monospace; font-size: 14px; margin-bottom: 24px; color: #fff; font-weight: bold; letter-spacing: 0.06em; }
        .row { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 10px 0; font-size: 13px; }
        .label { color: #888; font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
        .value { color: #fbfaf6; font-weight: 600; text-align: right; }
        .instructions-wrap { margin-top: 24px; }
        .instructions-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 16px; font-size: 13px; line-height: 1.5; color: #e5e5e5; margin-top: 8px; white-space: pre-wrap; }
        .footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.08); font-family: monospace; font-size: 11px; color: #666; text-align: center; letter-spacing: 0.1em; }
        a { color: #fbfaf6; }
      </style>
    </head>
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
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [NOTIFICATION_EMAIL],
      subject: `[XTICH Bespoke] Commission ${data.reference} — ${data.name}`,
      html
    });

    if (error) {
      console.error('[Resend] Bespoke email error:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] Bespoke notification delivered for ${data.reference}`);
    return { success: true };
  } catch (err) {
    console.error('[Resend] Bespoke email exception:', err.message);
    return { success: false, error: err.message };
  }
}

// ===========================================================================
// API Routes
// ===========================================================================

// ---------------------------------------------------------------------------
// POST /api/subscribe
// Hero allocation / newsletter subscription.
// ---------------------------------------------------------------------------
app.post('/api/subscribe', subscribeLimit, async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const db = requireSupabase();
    const cleanEmail = email.trim().toLowerCase();

    // Insert subscriber — unique constraint on email handles duplicates
    const { error: insertError } = await db
      .from('subscribers')
      .insert({ email: cleanEmail, source: 'hero_allocation_bar' });

    let isNew = true;
    if (insertError) {
      if (insertError.code === '23505') {
        // Duplicate — treat as success but note it
        isNew = false;
      } else {
        console.error('[Supabase] Subscriber insert error:', insertError.message);
        const err = new Error('Failed to record subscription.');
        err.status = 500;
        throw err;
      }
    }

    // Log event (non-blocking)
    logEvent(db, isNew ? 'subscriber.new' : 'subscriber.duplicate', cleanEmail, {
      source: 'hero_allocation_bar'
    });

    // Always fire Resend notification (owner wants to know of all sign-ups)
    const notificationResult = await sendAllocationNotification(cleanEmail);

    return res.status(200).json({
      success: true,
      message: isNew ? 'Priority allocation confirmed.' : 'Already on the priority list.',
      email: cleanEmail,
      notified: Boolean(notificationResult?.success && !notificationResult?.simulated)
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/bespoke
// Custom hoodie commission submission with optional file upload.
// ---------------------------------------------------------------------------
app.post('/api/bespoke', bespokeLimit, (req, res, next) => {
  upload.single('referenceFile')(req, res, async (uploadErr) => {
    if (uploadErr) {
      if (uploadErr.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `File too large. Maximum size is ${MAX_FILE_MB}MB.` });
      }
      return res.status(400).json({ error: uploadErr.message });
    }

    try {
      const {
        name,
        email,
        hoodieColor        = 'Obsidian',
        hoodieColorCode    = '01 / OBSIDIAN',
        hoodieColorHex     = '#0A0A0A',
        size               = 'M',
        quantity           = '1',
        embroideryType     = 'TEXT',
        embroideryPlacement = 'CHEST',
        embroideryText     = 'XTICH',
        embroideryScale    = 'SMALL',
        thread             = 'WHITE',
        customInstructions = '',
        requestId
      } = req.body || {};

      // Field validation
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Customer name must be at least 2 characters.' });
      }
      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Valid customer email is required.' });
      }

      const parsedQty = parseInt(quantity, 10);
      if (isNaN(parsedQty) || parsedQty < 1 || parsedQty > 100) {
        return res.status(400).json({ error: 'Quantity must be between 1 and 100.' });
      }

      const db = requireSupabase();

      // Generate unique commission reference (XT-2026-XXXXX)
      const year = new Date().getFullYear();
      const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const reference = requestId && requestId.startsWith('XT-')
        ? requestId
        : `XT-${year}-${suffix}`;

      // --- Step 1: Upload file to Supabase Storage (if provided) ---
      let storagePath      = null;
      let originalFilename = null;

      if (req.file) {
        originalFilename = req.file.originalname;
        storagePath = await uploadToStorage(
          db,
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
      }

      // --- Step 2: Insert commission record ---
      const { data: commissionRow, error: commissionError } = await db
        .from('bespoke_commissions')
        .insert({
          reference,
          email:             email.trim(),
          name:              name.trim(),
          hoodie_color:      hoodieColor.trim(),
          hoodie_color_code: hoodieColorCode.trim(),
          hoodie_color_hex:  hoodieColorHex.trim(),
          embroidery_type:   embroideryType.toUpperCase(),
          embroidery_text:   (embroideryText.trim() || 'XTICH'),
          placement:         embroideryPlacement.toUpperCase(),
          scale:             embroideryScale.toUpperCase(),
          thread:            thread.toUpperCase(),
          size:              size.toUpperCase(),
          quantity:          parsedQty,
          custom_instructions: customInstructions.trim().substring(0, 2000),
          status:            'pending'
        })
        .select('id')
        .single();

      if (commissionError) {
        console.error('[Supabase] Commission insert error:', commissionError.message);
        // If file was already uploaded, this is a partial failure — log it
        if (storagePath) {
          logEvent(db, 'commission.insert_failed_after_upload', email.trim(), {
            reference, storagePath
          });
        }
        const err = new Error('Failed to save commission.');
        err.status = 500;
        throw err;
      }

      // --- Step 3: Insert asset metadata ---
      if (storagePath && commissionRow?.id) {
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
          // Non-fatal — commission is saved, just log
          console.error('[Supabase] Asset metadata insert error:', assetError.message);
          logEvent(db, 'asset.metadata_failed', email.trim(), {
            reference, storagePath
          });
        }
      }

      // --- Step 4: Log event ---
      logEvent(db, 'commission.submitted', email.trim(), {
        reference,
        has_file: Boolean(storagePath)
      });

      // --- Step 5: Send Resend notification (non-blocking) ---
      const signedUrl = storagePath ? await getSignedUrl(db, storagePath) : null;

      sendBespokeNotification({
        reference,
        name:             name.trim(),
        email:            email.trim(),
        hoodieColorCode:  hoodieColorCode.trim(),
        hoodieColorHex:   hoodieColorHex.trim(),
        embroideryType:   embroideryType.toUpperCase(),
        embroideryText:   embroideryText.trim() || 'XTICH',
        placement:        embroideryPlacement.toUpperCase(),
        scale:            embroideryScale.toUpperCase(),
        thread:           thread.toUpperCase(),
        size:             size.toUpperCase(),
        quantity:         parsedQty,
        customInstructions: customInstructions.trim().substring(0, 2000),
        originalFilename,
        timestamp:        new Date().toISOString()
      }, signedUrl).catch(err => {
        console.error('[Notification] Bespoke email failed (non-fatal):', err.message);
      });

      return res.status(200).json({
        success: true,
        reference,
        message: 'Bespoke commission lodged successfully.'
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
      // Lightweight ping — count rows in subscribers (service_role bypasses RLS)
      const { error } = await supabase
        .from('subscribers')
        .select('id', { count: 'exact', head: true });
      dbStatus = error ? 'degraded' : 'connected';
    } catch (_) {
      dbStatus = 'degraded';
    }
  }

  res.status(200).json({
    ok: true,
    service: 'xtich-atelier',
    database: dbStatus,
    port: String(PORT),
    timestamp: new Date().toISOString()
  });
});

// ---------------------------------------------------------------------------
// Centralized Error Handler — must be defined AFTER all routes
// Never expose stack traces or env var names in production.
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  const status  = err.status || 500;
  const isKnown = status < 500;

  if (!isKnown) {
    // Log full error server-side for debugging
    console.error('[Server Error]', err.message);
  }

  // Safe response — no internals exposed
  res.status(status).json({
    error: isKnown ? err.message : 'An unexpected error occurred. Please try again.'
  });
});

// ===========================================================================
// Static File Serving (Vite dist/ + SPA fallback)
// ===========================================================================

// Security: Block direct access to sensitive server-side files
app.use((req, _res, next) => {
  const p = req.path.toLowerCase();
  if (
    p.includes('.env') ||
    p.includes('server.js') ||
    p.includes('subscribers.json') ||
    p.includes('package.json') ||
    p.includes('supabase')
  ) {
    // Let the error handler deal with it cleanly
    const err = new Error('Access forbidden.');
    err.status = 403;
    return next(err);
  }
  next();
});

const distDir   = path.resolve(__dirname, 'dist');
const publicDir = path.resolve(__dirname, 'public');

function serveIndex(req, res) {
  const distIndex = path.resolve(distDir, 'index.html');
  const rootIndex = path.resolve(__dirname, 'index.html');
  const target    = fs.existsSync(distIndex) ? distIndex : rootIndex;

  if (!fs.existsSync(target)) {
    console.error('[Server] index.html not found. Run npm run build.');
    return res.status(500).send('Production build not found. Run npm run build.');
  }

  res.sendFile(target, { dotfiles: 'allow' }, (err) => {
    if (err && !res.headersSent) {
      console.warn('[Server] sendFile fallback — piping stream:', err.message);
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

// SPA catch-all (after all API routes)
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
