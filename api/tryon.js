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

    const externalResp = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const contentType = externalResp.headers.get('content-type') || 'application/json';
    const buffer = await externalResp.arrayBuffer();

    res.status(externalResp.status);
    res.setHeader('Content-Type', contentType);
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
