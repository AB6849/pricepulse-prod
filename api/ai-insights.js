export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.CEREBRAS_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'AI API key not configured' });

    try {
        const { platform, brandName, metrics } = req.body;
        console.log(`[AI Insights] Request for brand: ${brandName}, platform: ${platform}`);

        if (!metrics) return res.status(400).json({ error: 'Metrics data is required' });

        const systemPrompt = `You are Traben AI, analyzing ${platform || 'quick-commerce'} data for the brand "${brandName || 'Unknown'}".

Generate EXACTLY 4 actionable insights from the provided metrics. Each insight must be a JSON object with:
- "title": Short headline (max 8 words)
- "description": One-line insight with specific numbers from the data
- "type": One of "growth", "warning", "opportunity", "trend"
- "icon": One of "trending-up", "alert-triangle", "zap", "bar-chart-2"

Focus on:
1. Top performer or fastest growing SKU
2. A risk/warning (low inventory, sales drops, stockouts)
3. An opportunity (underserved city, untapped category)
4. A trend (week-over-week pattern, seasonality)

Return ONLY a JSON object with an "insights" array. No markdown, no explanation.`;

        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama3.1-8b',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Metrics:\n${JSON.stringify(metrics, null, 2)}` }
                ],
                temperature: 0.3,
                max_tokens: 800,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('[AI Insights] Cerebras API error:', response.status, errData);
            return res.status(502).json({
                error: 'AI service error',
                message: errData.error?.message || 'The AI model failed to analyze the data'
            });
        }

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content || '{"insights":[]}';

        let insights;
        try {
            const parsed = JSON.parse(raw);
            insights = parsed.insights || parsed;
        } catch {
            insights = [];
        }

        return res.status(200).json({
            insights: Array.isArray(insights) ? insights.slice(0, 4) : [],
            tokens: data.usage?.total_tokens || 0
        });
    } catch (error) {
        console.error('AI Insights error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
