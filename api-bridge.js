import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic handler for Vercel functions
app.all('/api/:function', async (req, res) => {
    const funcName = req.params.function;
    const funcPath = join(__dirname, 'api', `${funcName}.js`);

    console.log(`[API Bridge] Calling: ${funcName}`);

    if (!fs.existsSync(funcPath)) {
        console.error(`[API Bridge] File not found: ${funcPath}`);
        return res.status(404).json({ error: `Function ${funcName} not found` });
    }

    try {
        // Import the handler from the api directory using pathToFileURL for ESM compatibility
        const fileUrl = pathToFileURL(funcPath).href;
        const { default: handler } = await import(`${fileUrl}?update=${Date.now()}`);

        // Mock the Vercel request/response behavior
        await handler(req, res);
    } catch (error) {
        console.error(`Error in function ${funcName}:`, error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 AI Bridge Server running at http://localhost:${port}`);
    console.log(`📡 Proxying /api/* requests from port 3000`);
});
