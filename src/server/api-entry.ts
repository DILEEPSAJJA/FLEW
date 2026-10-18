import { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from './router';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-role');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const handled = await handleApiRequest(req, res);
    if (!handled && !res.writableEnded) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message: 'API route not found' }));
    }
  } catch (err: any) {
    console.error('[API Serverless Error]:', err);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: err?.message || 'Internal Server Error',
        stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined,
      }));
    }
  }
}
