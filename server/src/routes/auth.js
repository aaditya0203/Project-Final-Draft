import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import db from '../db/database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Sign-In
router.post('/google', async (req, res) => {
    try {
        const { credential, accessToken, role } = req.body; 

        if (!credential && !accessToken) {
            return res.status(400).json({ error: 'Google credential or access token is required' });
        }

        let payload;
        if (credential) {
            console.log('[Auth] Attempting login with ID Token (credential)');
            // Verify the Google ID token
            try {
                const ticket = await client.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                payload = ticket.getPayload();
                console.log('[Auth] ID Token verified for:', payload.email);
            } catch (error) {
                console.error('[Auth] Google ID token verification failed:', error);
                return res.status(401).json({ error: 'Invalid Google ID token' });
            }
        } else if (accessToken) {
            console.log('[Auth] Attempting login with Access Token');
            // Verify the Access Token
            try {
                // We use the token info endpoint for access tokens
                const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
                if (!response.ok) {
                    const errorData = await response.text();
                    console.error('[Auth] Google userinfo fetch failed:', response.status, errorData);
                    throw new Error('Failed to fetch user info from Google');
                }
                payload = await response.json();
                console.log('[Auth] Access Token verified for:', payload.email);
                // Ensure sub exists
                if (!payload.sub) {
                    console.error('[Auth] Invalid user info payload (missing sub)');
                    throw new Error('Invalid user info payload');
                }
            } catch (error) {
                console.error('[Auth] Google access token verification failed:', error);
                return res.status(401).json({ error: 'Invalid Google access token' });
            }
        }

        const { email, name, sub: googleId } = payload;
        const displayName = name || email.split('@')[0];

        // Check if user exists
        let user = await db.getUserByEmail(email);

        if (!user) {
            // Optional: Enforce contractor domain if signing up as contractor
            if (role === 'contractor' && !email.endsWith('@constructify.com')) {
                return res.status(403).json({
                    error: 'Contractors must use a @constructify.com email address'
                });
            }

            // Create new user (using dummy password since they authenticate via Google)
            const userId = await db.createUser(email, null, displayName, role || 'user', googleId);
            user = { id: userId, email, name: displayName, role: role || 'user', google_id: googleId };
        } else {
            // If the user already exists, update their google_id if it's missing (account linking)
            if (!user.google_id) {
                 console.log(`Linked Google account for existing user ${email}`);
            }

            if (role && user.role !== role) {
                console.warn(`Role mismatch for user ${email}: expected ${user.role}, got ${role}`);
            }
            // Use existing name or the one from Google
            user.name = user.name || displayName;
        }

        // Generate our own JWT token for session management
        const token = generateToken({ id: user.id, email: user.email });

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });

    } catch (error) {
        console.error('Google Auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

export default router;

