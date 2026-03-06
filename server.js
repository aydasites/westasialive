const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'; // set to your GitHub Pages URL in production

if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}

app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['POST'],
}));

app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'conflict-tracker-proxy' }));

// Proxy endpoint — forwards requests to Anthropic
app.post('/api/query', async (req, res) => {
  try {
    const { model, max_tokens, tools, messages } = req.body;

    // Basic validation
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({ model, max_tokens, tools, messages }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal proxy error' });
  }
});

app.listen(PORT, () => {
  console.log(`Conflict Tracker proxy running on port ${PORT}`);
});
