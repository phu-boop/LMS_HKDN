import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const data = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    fs.appendFileSync(path.join(process.cwd(), 'debug_log.txt'), data + '\n');
    res.status(200).json({ success: true });
  } else {
    res.status(405).end();
  }
}
