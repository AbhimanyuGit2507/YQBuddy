import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';
import https from 'https';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const backendPath = url.pathname.replace(/^\/api/, '');
  const queryString = url.search;
  
  const backendHost = new URL(BACKEND_URL);
  const isHttps = backendHost.protocol === 'https:';
  
  const options: http.RequestOptions | https.RequestOptions = {
    hostname: backendHost.hostname,
    port: parseInt(backendHost.port) || (isHttps ? 443 : 80),
    path: `${backendPath}${queryString}`,
    method: req.method,
    headers: {
      ...req.headers,
      host: backendHost.hostname,
    },
  };

  const transport = isHttps ? https : http;

  const proxyReq = transport.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode || 200);
    if (proxyRes.headers) {
      Object.entries(proxyRes.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'transfer-encoding') {
          res.setHeader(key, value as string);
        }
      });
    }
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.status(500).json({ message: 'Proxy error', error: err.message });
  });

  if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method || '') && Object.keys(req.body).length > 0) {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    proxyReq.write(body);
    if (options.headers && typeof options.headers === 'object') {
      delete (options.headers as Record<string, string>)['content-length'];
    }
  }
  proxyReq.end();
}
