import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { assertDocumentViewerAuth, sanitizeDocumentViewerId } from '../../../../server/documentViewerAuth';
import { PDF_REMOTE_BY_ID } from '../../../../server/documentPdfSources';

function localPdfPathForId(id: string): string | null {
  if (id !== 'sample') return null;
  const p = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'samples', 'lecture-sample.pdf');
  return fs.existsSync(p) ? p : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  if (!assertDocumentViewerAuth(req, res)) {
    return;
  }

  const raw = req.query.id;
  const q = Array.isArray(raw) ? raw[0] : raw;
  const id = sanitizeDocumentViewerId(q);
  if (!id) {
    return res.status(400).end('Invalid id');
  }

  const localPath = localPdfPathForId(id);
  if (localPath) {
    try {
      const buf = fs.readFileSync(localPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).send(buf);
    } catch {
      return res.status(500).end('Read failed');
    }
  }

  let remote = PDF_REMOTE_BY_ID[id];
  if (!remote) {
    try {
      const token = req.headers.authorization;
      const hostApi = process.env.NEXT_PUBLIC_HOST_API_URL || 'http://localhost:8080';
      const backendUrl = `${hostApi.replace(/\/$/, '')}/api/client/contents/${id}/view-url`;
      const viewRes = await fetch(backendUrl, {
        headers: token ? { Authorization: token } : {},
      });
      if (viewRes.ok) {
        const data = await viewRes.json();
        remote = data?.url || data?.viewUrl || (typeof data === 'string' ? data : '');
      }
    } catch (err) {
      console.error('Failed to resolve remote PDF URL:', err);
    }
  }

  if (!remote) {
    return res.status(404).end('Not found');
  }

  try {
    const upstream = await fetch(remote);
    if (!upstream.ok) {
      return res.status(502).end('Upstream error');
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(buf);
  } catch {
    return res.status(502).end('Fetch failed');
  }
}
