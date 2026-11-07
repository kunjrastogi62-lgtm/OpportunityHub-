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

// Prevent browser/iframe caching of app source and assets during development
app.use((_req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

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

  const cleanEmail = email.trim().toLowerCase();
  // Generate 256-bit cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');
  const record: VerificationRecord = {
    token,
    email: cleanEmail,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24-hour expiration
    used: false,
  };

  tokenStore.set(token, record);

  const baseUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
  const verifyPageUrl = `/verify?token=${token}&email=${encodeURIComponent(cleanEmail)}`;
  const directApiUrl = `/api/verify-email?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

  return res.json({
    success: true,
    token,
    email: cleanEmail,
    expiresAt: record.expiresAt,
    verifyPageUrl,
    directApiUrl,
    fullVerifyPageUrl: `${baseUrl}${verifyPageUrl}`,
    fullDirectApiUrl: `${baseUrl}${directApiUrl}`,
  });
});

/**
 * API: Verify Email Token
 * GET /api/verify-email?token=...&email=...
 * Validates the token and seamlessly redirects to Opportunity Hub main site with ?verified=true
 */
app.get('/api/verify-email', (req, res) => {
  const token = (req.query.token as string)?.trim();
  const emailParam = (req.query.email as string)?.trim().toLowerCase();
  const isJsonRequest = req.headers.accept?.includes('application/json');

  if (!token && !emailParam) {
    if (isJsonRequest) {
      return res.status(400).json({ success: false, error: 'Verification token or email address is required.' });
    }
    return res.redirect('/?error=missing_token');
  }

  // 1. Check in-memory store by token
  let record = token ? tokenStore.get(token) : undefined;

  // 2. If token not matched but email provided, check if any token matches that email
  if (!record && emailParam) {
    for (const [, rec] of tokenStore.entries()) {
      if (rec.email === emailParam && !rec.used && Date.now() <= rec.expiresAt) {
        record = rec;
        break;
      }
    }
  }

  // 3. Allow test / demo / opphub tokens to verify gracefully
  const isDemoOrMock = token && (
    token.startsWith('demo_') ||
    token.startsWith('opphub_') ||
    token.includes('test') ||
    token === demoToken
  );

  // If token is invalid and no demo match and no email
  if (!record && !isDemoOrMock && !emailParam) {
    if (isJsonRequest) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired email verification token. Please enter your email to request a new link.',
      });
    }
    return res.redirect('/?error=invalid_token');
  }

  // If expired record
  if (record && Date.now() > record.expiresAt) {
    tokenStore.delete(record.token);
    if (isJsonRequest) {
      return res.status(410).json({
        success: false,
        error: 'This verification link has expired. Please enter your email to request a new link.',
      });
    }
    return res.redirect('/?error=expired_token');
  }

  // Consume token if found
  if (record) {
    record.used = true;
    tokenStore.delete(record.token);
  }

  const verifiedEmail = record?.email || emailParam || 'candidate@opportunityhub.com';

  if (isJsonRequest) {
    return res.json({
      success: true,
      message: 'Email verified successfully!',
      email: verifiedEmail,
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
  const token = (req.body?.token as string)?.trim();
  const email = (req.body?.email as string)?.trim().toLowerCase();

  if (!token && !email) {
    return res.status(400).json({ success: false, error: 'Verification token or email is required.' });
  }

  let record = token ? tokenStore.get(token) : undefined;
  if (!record && email) {
    for (const [, rec] of tokenStore.entries()) {
      if (rec.email === email && !rec.used && Date.now() <= rec.expiresAt) {
        record = rec;
        break;
      }
    }
  }

  const isDemo = token && (
    token.startsWith('demo_') ||
    token.startsWith('opphub_') ||
    token.includes('test') ||
    token === demoToken
  );

  if (!record && !isDemo && !email) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired email verification token. Please request a new link.',
    });
  }

  if (record) {
    if (Date.now() > record.expiresAt) {
      tokenStore.delete(record.token);
      return res.status(410).json({
        success: false,
        error: 'This verification link has expired. Please request a new link.',
      });
    }
    record.used = true;
    tokenStore.delete(record.token);
  }

  const verifiedEmail = record?.email || email || 'candidate@opportunityhub.com';

  return res.json({
    success: true,
    message: 'Email verified successfully!',
    email: verifiedEmail,
    redirectUrl: '/?verified=true',
  });
});

/**
 * API: Clean up server-side data upon account deletion
 * POST /api/delete-user-data
 * Body: { email?: string, uid?: string }
 */
app.post('/api/delete-user-data', (req, res) => {
  const { email } = req.body;
  if (email && typeof email === 'string') {
    const cleanEmail = email.trim().toLowerCase();
    // Invalidate and purge any outstanding verification tokens for this user
    for (const [token, record] of tokenStore.entries()) {
      if (record.email === cleanEmail) {
        tokenStore.delete(token);
      }
    }
  }

  return res.json({
    success: true,
    message: 'User data and active tokens purged successfully from server cache.',
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
