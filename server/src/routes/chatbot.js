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
        
        // Comprehensive list of fallback models
        const modelsToTry = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro',
            'gemini-1.0-pro'
        ];

        let result;
        let successfulModel = '';
        let lastError = null;

        // Iterative model selection with robust error handling
        for (const modelName of modelsToTry) {
            try {
                console.log(`🤖 Attempting to use model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                // Build a COMPREHENSIVE system prompt
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
IMPORTANT: ${context?.isAuthenticated ? 'The user is ALREADY logged in. Do NOT suggest logging in or creating an account.' : 'The user is not logged in. Tell them to log in for project details.'}`;

                const prompt = `${systemPrompt}\n\nUser Question: ${message}`;
                
                result = await model.generateContent(prompt);
                successfulModel = modelName;
                console.log(`✅ Success with model: ${modelName}`);
                break; // Exit loop on first success
            } catch (err) {
                lastError = err;
                const status = err.status || (err.response && err.response.status);
                const msg = err.message || '';
                console.warn(`⚠️ Model ${modelName} failed. Status: ${status}, Error: ${msg.substring(0, 100)}`);
                
                // If it's a 403 (Permission/Key), don't keep trying other models
                if (status === 403 || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
                    throw err; 
                }
                // Otherwise keep trying (404, 500 etc)
            }
        }

        if (!result) {
            throw lastError || new Error('All Gemini models failed to initialize');
        }

        const response = await result.response;
        const text = response.text();

        res.json({
            message: text,
            timestamp: new Date().toISOString(),
            role: 'assistant',
            model: successfulModel
        });
    } catch (error) {
        const status = error.status || (error.response && error.response.status);
        console.error('❌ Chatbot Final API Error:', {
            status,
            message: error.message
        });

        let errorMessage = "AI Brain Error: ";
        if (status === 403) {
            errorMessage += "Access Denied (403). Your API key is likely invalid or restricted. Please check Google AI Studio. ";
        } else if (status === 404) {
            errorMessage += "Model Not Found (404). Your API key might not have access to Gemini 1.5/Pro yet. ";
        } else {
            errorMessage += `Service Error (${status || 'Unknown'}): ${error.message} `;
        }

        const fallback = getFallbackResponse(req.body.message);
        fallback.message = errorMessage + "\n\n" + fallback.message;
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
