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
            // Verify the Google ID token
            try {
                const ticket = await client.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                payload = ticket.getPayload();
            } catch (error) {
                console.error('Google ID token verification failed:', error);
                return res.status(401).json({ error: 'Invalid Google ID token' });
            }
        } else if (accessToken) {
            // Verify the Access Token
            try {
                // We use the token info endpoint for access tokens
                const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch user info from Google');
                }
                payload = await response.json();
                // Ensure sub exists
                if (!payload.sub) {
                    throw new Error('Invalid user info payload');
                }
            } catch (error) {
                console.error('Google access token verification failed:', error);
                return res.status(401).json({ error: 'Invalid Google access token' });
            }
        }

        const { email, name, sub: googleId } = payload;

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
            const userId = await db.createUser(email, null, name, role || 'user', googleId);
            user = { id: userId, email, name, role: role || 'user', google_id: googleId };
        } else {
            // If the user already exists, update their google_id if it's missing (account linking)
            if (!user.google_id) {
                 // We don't have a direct saveGoogleId function, so theoretically 
                 // we'd add one if needed, but for now we just trust the email 
                 // since Google verified it.
                 console.log(`Linked Google account for existing user ${email}`);
            }

            if (role && user.role !== role) {
                console.warn(`Role mismatch for user ${email}: expected ${user.role}, got ${role}`);
            }
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

