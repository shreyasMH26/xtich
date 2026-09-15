import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      name: 'bespoke-api-dev-handler',
      configureServer(server) {
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
                name = 'Client',
                email = 'client@example.com',
                hoodieColor = 'Obsidian',
                hoodieColorCode = '01 / OBSIDIAN',
                size = 'S',
                quantity = '1',
                embroideryType = 'TEXT',
                embroideryPlacement = 'CHEST',
                embroideryText = 'XTICH',
                embroideryScale = 'SMALL',
                thread = 'WHITE',
                customInstructions = '',
                requestId
              } = req.body || {};

              const finalRequestId = requestId || `REQUEST / ${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
              let uploadedReferenceUrl = null;

              if (req.file) {
                const config = cloudinary.config();
                const isConfigured = Boolean(config.cloud_name && (process.env.CLOUDINARY_URL || config.api_key));
                if (isConfigured) {
                  const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
                  const uploadResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                      { folder: 'xtich/bespoke', resource_type: isPdf ? 'raw' : 'auto' },
                      (uErr, uRes) => (uErr ? reject(uErr) : resolve(uRes))
                    );
                    stream.end(req.file.buffer);
                  });
                  uploadedReferenceUrl = uploadResult.secure_url;
                } else {
                  uploadedReferenceUrl = `https://res.cloudinary.com/xtich/image/upload/xtich/bespoke/${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                }
              }

              if (process.env.RESEND_API_KEY) {
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                  from: process.env.RESEND_FROM_EMAIL || 'XTICH Atelier <onboarding@resend.dev>',
                  to: [process.env.XTICH_NOTIFICATION_EMAIL || 'shreyasmh26@gmail.com'],
                  subject: `[XTICH Bespoke] Commission ${finalRequestId} — ${name}`,
                  text: `New Bespoke Commission:\nID: ${finalRequestId}\nName: ${name}\nEmail: ${email}\nColor: ${hoodieColorCode} (${hoodieColor})\nSize: ${size}\nQuantity: ${quantity}\nType: ${embroideryType}\nPlacement: ${embroideryPlacement}\nText: ${embroideryText}\nScale: ${embroideryScale}\nThread: ${thread}\nInstructions: ${customInstructions}\nFile: ${req.file ? req.file.originalname : 'None'}`
                });
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                requestId: finalRequestId,
                cloudinaryUrl: uploadedReferenceUrl
              }));
            } catch (apiErr) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: apiErr.message }));
            }
          });
        });
      }
    }
  ]
});
