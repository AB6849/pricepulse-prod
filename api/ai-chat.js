export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.CEREBRAS_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'AI API key not configured' });

    try {
        const { question, brandData, platform, brandName, pageContext } = req.body;
        console.log(`[AI Chat] Request for brand: ${brandName}, platform: ${platform}`);

        if (!question) return res.status(400).json({ error: 'Question is required' });

        const systemPrompt = `You are "Traben AI", a senior e-commerce analytics expert embedded in the Traben brand intelligence platform. You help D2C brand managers analyze their quick-commerce performance across Blinkit, Zepto, and Swiggy Instamart.

RULES:
- Be concise, sharp, and data-driven. Use bullet points.
- If data is provided, reference specific numbers. Never make up data.
- Use Indian currency formatting (₹, Lakhs, Crores) and Indian city names.
- When comparing, highlight % differences.
- End with 1-2 actionable recommendations when relevant.
- If asked something you cannot answer from the data, say so honestly.
- Format responses in clean markdown with headers and bullets.
- Keep responses under 300 words unless the user asks for detail.

CONTEXT:
- Brand: ${brandName || 'Unknown'}
- Current Platform Focus: ${platform || 'All'}
- Page: ${pageContext || 'Dashboard'}`;

        const userMessage = brandData
            ? `Here is the current brand data:\n\`\`\`json\n${JSON.stringify(brandData, null, 2)}\n\`\`\`\n\nUser Question: ${question}`
            : `User Question: ${question}`;

        const requestBody = {
            model: 'llama3.1-8b',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.4,
            max_tokens: 1000
        };

        console.log('[AI Chat] Sending to Cerebras:', JSON.stringify({ model: requestBody.model }));

        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('[AI Chat] Cerebras API error:', response.status, errData);
            // Return the specific error from Cerebras if available
            return res.status(502).json({
                error: 'AI service error',
                message: errData.error?.message || 'The AI model failed to respond'
            });
        }

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || 'I could not generate a response.';

        return res.status(200).json({
            answer,
            model: data.model,
            tokens: data.usage?.total_tokens || 0
        });
    } catch (error) {
        console.error('AI Chat error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
