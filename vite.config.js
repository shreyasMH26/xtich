import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  plugins: [
    {
      name: 'xtich-api-dev-handler',
      configureServer(server) {

        // ------------------------------------------------------------------
        // POST /api/bespoke — dev mock
        // ------------------------------------------------------------------
        server.middlewares.use('/api/bespoke', (req, res, next) => {
          if (req.method !== 'POST') return next();

          upload.single('referenceFile')(req, res, async (err) => {
            if (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err.message }));
            }

            try {
              const {
                name              = 'Client',
                email             = 'client@example.com',
                hoodieColorCode   = '01 / OBSIDIAN',
                size              = 'M',
                quantity          = '1',
                embroideryType    = 'TEXT',
                embroideryPlacement = 'CHEST',
                embroideryText    = 'XTICH',
                embroideryScale   = 'SMALL',
                thread            = 'WHITE',
                customInstructions = '',
                requestId
              } = req.body || {};

              const year      = new Date().getFullYear();
              const suffix    = Math.random().toString(36).substring(2, 7).toUpperCase();
              const reference = requestId && requestId.startsWith('XT-')
                ? requestId
                : `XT-${year}-${suffix}`;

              // Simulate Resend notification in dev
              if (process.env.RESEND_API_KEY) {
                try {
                  const resend = new Resend(process.env.RESEND_API_KEY);
                  await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'XTICH Atelier <onboarding@resend.dev>',
                    to: [process.env.XTICH_NOTIFICATION_EMAIL || 'xtichalt@gmail.com'],
                    subject: `[DEV] [XTICH Bespoke] Commission ${reference} — ${name}`,
                    text: [
                      `Commission: ${reference}`,
                      `Name: ${name}`, `Email: ${email}`,
                      `Color: ${hoodieColorCode}`, `Size: ${size}`,
                      `Quantity: ${quantity}`, `Type: ${embroideryType}`,
                      `Placement: ${embroideryPlacement}`, `Text: ${embroideryText}`,
                      `Scale: ${embroideryScale}`, `Thread: ${thread}`,
                      `Instructions: ${customInstructions}`,
                      `File: ${req.file ? req.file.originalname : 'None'}`
                    ].join('\n')
                  });
                } catch (_) {}
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                reference,
                message: 'Bespoke commission lodged successfully. (dev mode)'
              }));
            } catch (apiErr) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Dev server error.' }));
            }
          });
        });

        // ------------------------------------------------------------------
        // POST /api/subscribe — dev mock
        // ------------------------------------------------------------------
        server.middlewares.use('/api/subscribe', (req, res, next) => {
          if (req.method !== 'POST') return next();
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { email } = JSON.parse(body || '{}');
              const emailRe   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

              if (!email || !emailRe.test(email.trim())) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Valid email address is required.' }));
              }

              const cleanEmail = email.trim().toLowerCase();
              console.log(`[Dev] New allocation subscriber: ${cleanEmail}`);

              if (process.env.RESEND_API_KEY) {
                try {
                  const resend = new Resend(process.env.RESEND_API_KEY);
                  await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || 'XTICH Atelier <onboarding@resend.dev>',
                    to: [process.env.XTICH_NOTIFICATION_EMAIL || 'xtichalt@gmail.com'],
                    subject: `[DEV] [XTICH Allocation] New Priority Subscriber: ${cleanEmail}`,
                    text: `New Priority Allocation Subscriber\nEmail: ${cleanEmail}\nTimestamp: ${new Date().toISOString()}`
                  });
                } catch (_) {}
              } else {
                console.warn('[Dev] RESEND_API_KEY not set — email simulated.');
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                email: cleanEmail,
                message: 'Priority allocation confirmed.',
                notified: Boolean(process.env.RESEND_API_KEY)
              }));
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid request.' }));
            }
          });
        });

      }
    }
  ]
});
