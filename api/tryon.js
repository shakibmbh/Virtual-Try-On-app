import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 6000 }); // ~10 calls/min to avoid quota issues

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const GEMINI_URL = process.env.GEMINI_API_URL;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_URL || !GEMINI_KEY) {
      return res.status(500).json({ error: 'Missing GEMINI_API_URL or GEMINI_API_KEY' });
    }

    // Debug log: Log the incoming request body to see what's being sent
    console.log('Incoming request body for Gemini API:', JSON.stringify(req.body, null, 2));

    // Rate-limited fetch to Gemini API
    const externalResp = await limiter.schedule(() =>
      fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GEMINI_KEY}`
        },
        body: JSON.stringify(req.body)
      })
    );

    const contentType = externalResp.headers.get('content-type') || 'application/json';
    const buffer = await externalResp.arrayBuffer();

    // Handle 429 specifically
    if (externalResp.status === 429) {
      const errorText = await externalResp.text();
      console.error('Gemini API quota exceeded:', errorText);
      return res.status(429).json({ 
        error: 'Quota exceeded. Please wait and try again later, or upgrade your Google Cloud billing plan.',
        details: errorText 
      });
    }

    // Handle other non-OK responses
    if (!externalResp.ok) {
      const errorText = await externalResp.text();
      console.error('Gemini API error:', errorText);
      return res.status(externalResp.status).json({ 
        error: 'API error occurred',
        details: errorText 
      });
    }

    // Success: Forward the response
    res.status(externalResp.status);
    res.setHeader('Content-Type', contentType);
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
