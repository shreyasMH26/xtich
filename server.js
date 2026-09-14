import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Cloudinary from env vars without exposing secrets
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// In-memory file storage only — NO storage on Render filesystem or GitHub
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB maximum
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype.toLowerCase();

    if (allowedTypes.test(ext) || allowedTypes.test(mime)) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Supported formats: JPG, PNG, WEBP, PDF (max 10MB)'));
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Upload a memory buffer to Cloudinary folder xtich/bespoke
 */
function uploadToCloudinary(buffer, originalname, mimetype) {
  return new Promise((resolve, reject) => {
    const config = cloudinary.config();
    const isConfigured = Boolean(config.cloud_name && (process.env.CLOUDINARY_URL || config.api_key));

    if (!isConfigured) {
      console.warn('[Cloudinary] Missing credentials in environment. Simulating cloud reference URL.');
      const sanitizedName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      return resolve({
        secure_url: `https://res.cloudinary.com/xtich/image/upload/xtich/bespoke/${Date.now()}_${sanitizedName}`,
        public_id: `xtich/bespoke/${Date.now()}_${sanitizedName}`
      });
    }

    const isPdf = mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf');
    const safeBaseName = path.parse(originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'xtich/bespoke',
        resource_type: isPdf ? 'raw' : 'auto',
        public_id: `${Date.now()}_${safeBaseName}`
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload stream error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Send editorial notification email via Resend
 */
async function sendBespokeNotification(data) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Resend] Missing RESEND_API_KEY. Simulating commission notification:');
    console.log(JSON.stringify(data, null, 2));
    return { success: true, simulated: true };
  }

  const resend = new Resend(apiKey);
  const recipient = process.env.XTICH_NOTIFICATION_EMAIL || 'shreyasmh26@gmail.com';
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'XTICH Atelier <onboarding@resend.dev>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0c0d; color: #fbfaf6; padding: 32px 16px; margin: 0; }
        .card { max-width: 620px; margin: 0 auto; background: #121214; border: 1px solid rgba(255,255,255,0.12); padding: 36px 32px; border-radius: 4px; }
        .tag { font-family: monospace; font-size: 11px; letter-spacing: 0.16em; color: #888; text-transform: uppercase; margin-bottom: 12px; }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 18px; letter-spacing: -0.02em; color: #fbfaf6; line-height: 1.2; }
        .ref-strip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); padding: 12px 16px; font-family: monospace; font-size: 14px; margin-bottom: 24px; color: #fff; font-weight: bold; letter-spacing: 0.06em; }
        .row { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); padding: 10px 0; font-size: 13px; }
        .label { color: #888; font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
        .value { color: #fbfaf6; font-weight: 600; text-align: right; }
        .instructions-wrap { margin-top: 24px; }
        .instructions-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 16px; font-size: 13px; line-height: 1.5; color: #e5e5e5; margin-top: 8px; white-space: pre-wrap; font-family: inherit; }
        .footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.08); font-family: monospace; font-size: 11px; color: #666; text-align: center; letter-spacing: 0.1em; }
        a { color: #fbfaf6; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="tag">XTICH / BESPOKE ATELIER COMMISSION</div>
        <h1>New Custom Piece Request</h1>
        <div class="ref-strip">${data.requestId}</div>

        <div class="row"><span class="label">Customer Name</span><span class="value">${data.name}</span></div>
        <div class="row"><span class="label">Customer Email</span><span class="value">${data.email}</span></div>
        <div class="row"><span class="label">Base Garment</span><span class="value">Heavyweight 450 GSM Hoodie</span></div>
        <div class="row"><span class="label">Hoodie Color</span><span class="value">${data.hoodieColorCode || data.hoodieColor || '01 / OBSIDIAN'} (${data.hoodieColorHex || '#0A0A0A'})</span></div>
        <div class="row"><span class="label">Garment Size</span><span class="value">${data.size}</span></div>
        <div class="row"><span class="label">Quantity</span><span class="value">${data.quantity} Unit(s)</span></div>
        <div class="row"><span class="label">Embroidery Type</span><span class="value">${data.embroideryType}</span></div>
        <div class="row"><span class="label">Placement</span><span class="value">${data.embroideryPlacement}</span></div>
        <div class="row"><span class="label">Embroidery Mark / Text</span><span class="value">"${data.embroideryText}"</span></div>
        <div class="row"><span class="label">Embroidery Scale</span><span class="value">${data.embroideryScale}</span></div>
        <div class="row"><span class="label">Thread Tone</span><span class="value">${data.thread}</span></div>
        <div class="row"><span class="label">Timestamp</span><span class="value">${data.timestamp}</span></div>

        ${data.uploadedReferenceUrl ? `
        <div class="row"><span class="label">Uploaded Reference</span><span class="value"><a href="${data.uploadedReferenceUrl}" target="_blank" rel="noopener noreferrer">${data.uploadedFilename || 'View Uploaded Blueprint'}</a></span></div>
        ` : `
        <div class="row"><span class="label">Uploaded Reference</span><span class="value">None (Concept text only)</span></div>
        `}

        <div class="instructions-wrap">
          <div class="label">Custom Instructions</div>
          <div class="instructions-box">${data.customInstructions || 'No additional custom instructions specified.'}</div>
        </div>

        <div class="footer">
          XTICH DIGITAL ATELIER · ARCHITECTURAL BESPOKE DISPATCH
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await resend.emails.send({
      from: fromAddress,
      to: [recipient],
      subject: `[XTICH Bespoke] Commission ${data.requestId} — ${data.name}`,
      html: htmlContent
    });
    return { success: true, res };
  } catch (err) {
    console.error('[Resend] Email dispatch error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Bespoke commission submission endpoint
 */
app.post('/api/bespoke', upload.single('referenceFile'), async (req, res) => {
  try {
    const {
      name,
      email,
      hoodieColor = 'Obsidian',
      hoodieColorCode = '01 / OBSIDIAN',
      hoodieColorHex = '#0A0A0A',
      size = 'S',
      quantity = '1',
      embroideryType = 'TEXT',
      embroideryPlacement = 'CHEST',
      embroideryText = 'XTICH',
      embroideryScale = 'SMALL',
      thread = 'WHITE',
      customInstructions = '',
      requestId
    } = req.body;

    // Strict validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Valid customer name is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Valid customer email address is required.' });
    }

    // Collision-resistant request reference generator (REQUEST / XXXXX)
    const finalRequestId = requestId && requestId.startsWith('REQUEST / ')
      ? requestId
      : `REQUEST / ${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    let uploadedReferenceUrl = null;
    let uploadedFilename = null;

    if (req.file) {
      uploadedFilename = req.file.originalname;
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      uploadedReferenceUrl = uploadResult.secure_url;
    }

    const commissionData = {
      requestId: finalRequestId,
      name: name.trim(),
      email: email.trim(),
      hoodie: `Heavyweight 450 GSM Hoodie (${hoodieColor.trim()})`,
      hoodieColor: hoodieColor.trim(),
      hoodieColorCode: hoodieColorCode.trim(),
      hoodieColorHex: hoodieColorHex.trim(),
      size: size.toUpperCase(),
      quantity: parseInt(quantity, 10) || 1,
      embroideryType: embroideryType.toUpperCase(),
      embroideryPlacement: embroideryPlacement.toUpperCase(),
      embroideryText: embroideryText.trim() || 'XTICH',
      embroideryScale: embroideryScale.toUpperCase(),
      thread: thread.toUpperCase(),
      customInstructions: customInstructions.trim().substring(0, 2000),
      uploadedFilename,
      uploadedReferenceUrl,
      timestamp: new Date().toISOString()
    };

    // Send email via Resend asynchronously
    sendBespokeNotification(commissionData).catch(err => {
      console.error('[Notification Error]', err);
    });

    return res.status(200).json({
      success: true,
      requestId: finalRequestId,
      cloudinaryUrl: uploadedReferenceUrl,
      message: 'Bespoke commission lodged successfully.'
    });
  } catch (err) {
    console.error('[/api/bespoke error]', err);
    return res.status(500).json({
      error: 'An error occurred while processing the bespoke commission.',
      details: err.message
    });
  }
});

// Serve static assets: prefer 'dist' if built, otherwise root directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir) && fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.use(express.static(__dirname));
  app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`XTICH Digital Atelier running on port ${PORT}`);
});
