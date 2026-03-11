import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/ask', async (req, res) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        console.log(`🔍 Chatbot: Checking API Key... ${apiKey ? 'Found' : 'Missing'}`);

        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            console.warn('⚠️ GEMINI_API_KEY is not configured. Falling back to limited mode.');
            return res.json(getFallbackResponse(message));
        }

        console.log(`📡 AI Request received. Context: ${JSON.stringify(context)}`);
        const genAI = new GoogleGenerativeAI(apiKey);

        // Using 'gemini-2.5-flash' - Verified as working for this specific API key
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Build a COMPREHENSIVE system prompt to make the AI "Project Specific"
        const systemPrompt = `You are the CONSTRUCTIFY AI ASSISTANT, a specialized expert in construction management and AI-powered site monitoring.

SESSION CONTEXT:
- Auth Status: ${context?.isAuthenticated ? 'Logged In' : 'Not Logged In'}
- Current View: ${context?.view || 'Unknown'}
- Active Project: ${context?.projectName || 'None selected'}

PROJECT KNOWLEDGE BASE:
1. Platform Features: Automated image analysis, progress tracking (SSIM scoring), safety hazard detection, and professional report generation.
2. Construction Stages we track: 
   - Planning, Foundation, Structural, Finishing.
3. Safety Focus: PPE Compliance and Site Hazard Detection.

Your personality: Professional and helpful. 
IMPORTANT: ${context?.isAuthenticated ? 'The user is ALREADY logged in. Do NOT suggest logging in or creating an account unless they specifically ask how.' : 'The user is not logged in. If they ask about project details, explain they need to log in first.'}
If the user mentions a project like "${context?.projectName}", acknowledge that you see they are currently viewing it.`;

        const prompt = `${systemPrompt}\n\nUser Question: ${message}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(`✅ AI Response generated successfully (${text.substring(0, 20)}...)`);

        res.json({
            message: text,
            timestamp: new Date().toISOString(),
            role: 'assistant'
        });
    } catch (error) {
        console.error('❌ Chatbot Error Details:', {
            status: error.status,
            message: error.message,
            stack: error.stack
        });

        // Categorize common API errors for better user feedback
        let errorMessage = "AI Brain Error: ";
        if (error.status === 403) {
            errorMessage += "Verification failed (403). Your API key might be restricted. ";
        } else if (error.status === 404) {
            errorMessage += "Model not found (404). This key doesn't support Gemini 2.0 Flash. ";
        } else {
            errorMessage += `Something went wrong: ${error.message} `;
        }

        const fallback = getFallbackResponse(req.body.message);
        fallback.message = errorMessage + " Falling back to assistant mode: " + fallback.message;
        res.json(fallback);
    }
});

function getFallbackResponse(message) {
    const msg = (message || "").toLowerCase();
    let response = "I'm currently running in limited mode because the AI API key is not configured. ";

    if (msg.includes('login')) {
        response += "To login, click the 'Sign In' button in the top right corner of the homepage and enter your credentials.";
    } else if (msg.includes('account') || msg.includes('signup') || msg.includes('register')) {
        response += "You can create a new account by clicking 'Get Started' on the home page or 'Sign Up' link on the login page.";
    } else if (msg.includes('project')) {
        response += "You can view your active projects on the Dashboard or in the Projects List section.";
    } else {
        response += "I can help you with logins, account creation, and general platform navigation. Please configure a GEMINI_API_KEY for more advanced assistance.";
    }

    return {
        message: response,
        timestamp: new Date().toISOString(),
        role: 'assistant',
        isFallback: true
    };
}

export default router;
