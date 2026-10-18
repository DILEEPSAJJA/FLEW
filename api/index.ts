import { handleApiRequest } from '../src/server/router';

export default async function handler(req: any, res: any) {
  const handled = await handleApiRequest(req, res);
  if (!handled && !res.writableEnded) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Not found' }));
  }
}
