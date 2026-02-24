export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.CEREBRAS_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'AI API key not configured' });

    try {
        const { brandName, platform, nuclearItems } = req.body;
        if (!nuclearItems || !Array.isArray(nuclearItems) || nuclearItems.length === 0) {
            return res.status(400).json({ error: 'Nuclear items data is required' });
        }

        // Send only top 15 items to stay within token limits
        const topItems = nuclearItems.slice(0, 15).map(item => ({
            name: item.item_name,
            drr: item.drr,
            current_inv: item.current_inv,
            doh: item.doh,
            status: item.status,
            facility_count: item.facility_count,
            category: item.category || 'General'
        }));

        const systemPrompt = `You are Traben AI's demand forecasting engine for "${brandName}" on ${platform || 'quick-commerce'}.

Analyze the SKU data and generate a 7-day demand forecast. For each SKU, return:
- "name": SKU name
- "predicted_demand_7d": Predicted total units needed in next 7 days (integer)
- "reorder_qty": Recommended reorder quantity (predicted_demand - current_inventory, minimum 0)
- "confidence": "high", "medium", or "low"
- "risk": "critical", "watch", or "healthy"
- "reason": One sentence explaining the forecast logic

Also generate:
- "summary": A 2-sentence overall brand demand outlook

Use DRR (Daily Run Rate) as the primary signal. Factor in:
- If DRR is high but inventory is low → critical, high reorder
- If DRR is low and inventory is adequate → healthy
- Use DOH (Days On Hand) to validate urgency

Return ONLY valid JSON with format: { "forecasts": [...], "summary": "..." }`;

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
                    { role: 'user', content: `SKU Data:\n${JSON.stringify(topItems, null, 2)}` }
                ],
                temperature: 0.2,
                max_tokens: 1500,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('[AI Forecast] Cerebras API error:', response.status, errData);
            return res.status(502).json({
                error: 'AI service error',
                message: errData.error?.message || 'The AI model failed to generate a forecast'
            });
        }

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content || '{"forecasts":[],"summary":""}';

        let result;
        try {
            result = JSON.parse(raw);
        } catch {
            result = { forecasts: [], summary: 'Unable to generate forecast.' };
        }

        return res.status(200).json({
            forecasts: result.forecasts || [],
            summary: result.summary || '',
            tokens: data.usage?.total_tokens || 0
        });
    } catch (error) {
        console.error('AI Forecast error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
