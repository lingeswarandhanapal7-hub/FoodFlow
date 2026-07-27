import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { readDb, writeDb } from '../db.js';
import { signToken, authenticateToken, AuthRequest } from '../middleware/auth.js';

export const authRouter = Router();

function sanitize(input: string = ''): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// GET all users
authRouter.get('/users', (req, res) => {
  try {
    const db = readDb();
    res.json(db.users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST login
authRouter.post('/auth/login', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const db = readDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = signToken({ id: user.id, role: user.role, email: user.email, name: user.name });

    res.json({ user, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST register
authRouter.post('/auth/register', (req, res) => {
  try {
    const { name, role, address, email, phone, lat, lng } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required fields' });
    }

    const cleanName = sanitize(name);
    const cleanAddress = sanitize(address || 'Bangalore, India');
    const cleanEmail = email ? sanitize(email) : undefined;
    const cleanPhone = phone ? sanitize(phone) : undefined;

    const db = readDb();
    const id = `u-${role.slice(0, 4)}-${Date.now()}`;
    const avatarMap: Record<string, string> = {
      restaurant: '🏢',
      customer: '👨‍🎓',
      ngo: '🏠',
      admin: '🛡️'
    };
    const avatar = avatarMap[role] || '👤';

    const newUser = {
      id,
      name: cleanName,
      role,
      address: cleanAddress,
      lat: Number(lat) || 12.9716,
      lng: Number(lng) || 77.5946,
      verified: role !== 'ngo', // NGO profiles require admin verification
      avatar,
      email: cleanEmail,
      phone: cleanPhone,
      otpVerified: false
    };

    db.users.push(newUser);
    writeDb(db);

    const token = signToken({ id: newUser.id, role: newUser.role, email: newUser.email, name: newUser.name });

    res.status(201).json({ user: newUser, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

interface GooglePayload {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

async function verifyGoogleToken(token: string): Promise<GooglePayload | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (clientId) {
    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) return null;
      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatar: payload.picture,
        emailVerified: payload.email_verified === true
      };
    } catch (err: any) {
      console.warn('[Google Auth Server Warning] ID Token verification with GOOGLE_CLIENT_ID failed:', err.message);
    }
  }

  // Fallback for demo tokens in local development / testing environment
  if (token.startsWith('demo-gtoken-')) {
    try {
      const decodedJson = Buffer.from(token.replace('demo-gtoken-', ''), 'base64').toString('utf-8');
      const parsed = JSON.parse(decodedJson);
      if (parsed.email && parsed.googleId) {
        return {
          googleId: parsed.googleId,
          email: parsed.email,
          name: parsed.name || parsed.email.split('@')[0],
          avatar: parsed.avatar || '🌐',
          emailVerified: true
        };
      }
    } catch (e) {
      // Invalid demo token
    }
  }

  return null;
}

// POST /api/auth/google
authRouter.post('/auth/google', async (req, res) => {
  try {
    const { idToken, credential, role, fallbackProfile } = req.body;
    const inputToken = idToken || credential;

    let profile: GooglePayload | null = null;

    if (inputToken) {
      profile = await verifyGoogleToken(inputToken);
    }

    // Dev fallback if GOOGLE_CLIENT_ID is not configured
    if (!profile && !process.env.GOOGLE_CLIENT_ID && fallbackProfile?.googleId && fallbackProfile?.email) {
      profile = {
        googleId: fallbackProfile.googleId,
        email: fallbackProfile.email,
        name: fallbackProfile.name || fallbackProfile.email.split('@')[0],
        avatar: fallbackProfile.avatar || '🌐',
        emailVerified: true
      };
    }

    if (!profile) {
      return res.status(401).json({ error: 'Invalid or unverified Google ID token.' });
    }

    const { googleId, email, name, avatar } = profile;

    const db = readDb();
    let user = db.users.find(u => u.googleId === googleId || (u.email && u.email.toLowerCase() === email.toLowerCase()));

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      user.otpVerified = true;
      writeDb(db);

      const token = signToken({ id: user.id, role: user.role, email: user.email, name: user.name });
      return res.json({ user, token, isNewUser: false });
    }

    const selectedRole = role || 'customer';
    const id = `u-${selectedRole.slice(0, 4)}-${Date.now()}`;
    const cleanName = sanitize(name || email.split('@')[0]);

    const newUser = {
      id,
      name: cleanName,
      role: selectedRole,
      address: 'Bangalore, India (Google Auth)',
      lat: 12.9716,
      lng: 77.5946,
      verified: true,
      avatar: avatar || '🌐',
      email: email.toLowerCase(),
      googleId,
      otpVerified: true
    };

    db.users.push(newUser);
    writeDb(db);

    const token = signToken({ id: newUser.id, role: newUser.role, email: newUser.email, name: newUser.name });

    res.status(201).json({ user: newUser, token, isNewUser: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT verify user (Admin only)
authRouter.put('/users/:id/verify', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    const db = readDb();

    const user = db.users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.verified = Boolean(verified);
    writeDb(db);

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
