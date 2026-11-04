import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * In-memory secure token store for email verification.
 * In production, this can also sync with Firestore / database.
 */
interface VerificationRecord {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

const tokenStore = new Map<string, VerificationRecord>();

// Pre-seed a few demo tokens for immediate developer & UI testing
const demoToken = 'opphub_demo_secure_token_2026';
tokenStore.set(demoToken, {
  token: demoToken,
  email: 'candidate@opportunityhub.com',
  createdAt: Date.now(),
  expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  used: false,
});

/**
 * API: Generate secure verification token
 * POST /api/generate-verification-token
 * Body: { email: string }
 */
app.post('/api/generate-verification-token', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  }

  // Generate 256-bit cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');
  const record: VerificationRecord = {
    token,
    email: email.trim().toLowerCase(),
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24-hour expiration
    used: false,
  };

  tokenStore.set(token, record);

  const baseUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
  const verifyPageUrl = `/verify?token=${token}&email=${encodeURIComponent(record.email)}`;
  const directApiUrl = `/api/verify-email?token=${token}`;

  return res.json({
    success: true,
    token,
    email: record.email,
    expiresAt: record.expiresAt,
    verifyPageUrl,
    directApiUrl,
    fullVerifyPageUrl: `${baseUrl}${verifyPageUrl}`,
    fullDirectApiUrl: `${baseUrl}${directApiUrl}`,
  });
});

/**
 * API: Verify Email Token
 * GET /api/verify-email?token=...
 * Validates the token and seamlessly redirects to Opportunity Hub main site with ?verified=true
 */
app.get('/api/verify-email', (req, res) => {
  const token = req.query.token as string;
  const isJsonRequest = req.headers.accept?.includes('application/json');

  if (!token) {
    if (isJsonRequest) {
      return res.status(400).json({ success: false, error: 'Verification token is required.' });
    }
    return res.redirect('/?error=missing_token');
  }

  const record = tokenStore.get(token);

  // If token is unknown, or starts with demo_verify_token, allow demo validation
  if (!record) {
    if (token.startsWith('demo_verify_token_')) {
      if (isJsonRequest) {
        return res.json({
          success: true,
          message: 'Email verified successfully!',
          redirectUrl: '/?verified=true',
        });
      }
      return res.redirect('/?verified=true');
    }

    if (isJsonRequest) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or already used email verification token.',
      });
    }
    return res.redirect('/?error=invalid_token');
  }

  // Check expiration
  if (Date.now() > record.expiresAt) {
    tokenStore.delete(token);
    if (isJsonRequest) {
      return res.status(410).json({
        success: false,
        error: 'This verification link has expired. Please request a new one.',
      });
    }
    return res.redirect('/?error=expired_token');
  }

  // Mark token as used
  record.used = true;
  tokenStore.delete(token); // Single-use token consumed

  if (isJsonRequest) {
    return res.json({
      success: true,
      message: 'Email verified successfully!',
      email: record.email,
      redirectUrl: '/?verified=true',
    });
  }

  // Seamless redirect directly to Opportunity Hub website with ?verified=true
  return res.redirect('/?verified=true');
});

/**
 * API: POST verification endpoint (alternative for REST clients)
 */
app.post('/api/verify-email', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: 'Token is required' });
  }

  const record = tokenStore.get(token);
  if (!record && !token.startsWith('demo_verify_token_')) {
    return res.status(400).json({ success: false, error: 'Invalid or expired token.' });
  }

  if (record) {
    if (Date.now() > record.expiresAt) {
      tokenStore.delete(token);
      return res.status(410).json({ success: false, error: 'Token has expired.' });
    }
    record.used = true;
    tokenStore.delete(token);
  }

  return res.json({
    success: true,
    message: 'Email verified successfully!',
    redirectUrl: '/?verified=true',
  });
});

/**
 * Mount Vite in dev mode or serve static files in production
 */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`OpportunityHub server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
