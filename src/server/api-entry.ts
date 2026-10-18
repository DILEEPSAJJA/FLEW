import { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from './router';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
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
