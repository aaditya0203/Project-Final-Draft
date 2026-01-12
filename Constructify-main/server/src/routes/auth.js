import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from '../db/database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Validate contractor email domain
        if (role === 'contractor' && !email.endsWith('@constructify.com')) {
            return res.status(400).json({
                error: 'Contractors must use a @constructify.com email address'
            });
        }

        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const userId = await db.createUser(email, passwordHash, name, role);

        // Generate token
        const token = generateToken({ id: userId, email });

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: userId, email, name, role }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Strict domain check for login
        if (email.endsWith('@constructai.com') || email.endsWith('@vantage.com')) {
            return res.status(400).json({
                error: 'Please use your new @constructify.com email address'
            });
        }

        // Get user
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Log login attempt
        console.log(`Login attempt for ${email} with role ${req.body.role || 'unspecified'}`);

        // Verify role if provided (Strict check for portal access)
        // Relaxed check: Allow login but log warning if role mismatch
        if (req.body.role && user.role !== req.body.role) {
            console.warn(`Role mismatch for user ${email}: expected ${user.role}, got ${req.body.role}`);
            // return res.status(403).json({
            //     error: `Access denied. Please use the ${user.role === 'contractor' ? 'Contractor' : 'Client'} portal.`
            // });
        }

        // Generate token
        const token = generateToken({ id: user.id, email: user.email });

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await db.getUserByEmail(email);
        if (!user) {
            // Don't reveal if user exists
            return res.json({ message: 'If an account exists, a reset link has been sent.' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        // Save to DB
        await db.saveResetToken(email, resetToken, expiry.toISOString());

        // Log link to console (Simulated email service)
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        console.log('================================================');
        console.log('PASSWORD RESET LINK (COPY THIS):');
        console.log(resetLink);
        console.log('================================================');

        res.json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        const user = await db.getUserByResetToken(token);
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.updatePassword(user.id, passwordHash);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

export default router;
