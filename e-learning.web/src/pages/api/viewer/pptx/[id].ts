import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { assertDocumentViewerAuth, sanitizeDocumentViewerId } from '../../../../server/documentViewerAuth';
import { resolveLocalPptxPath } from '../../../../server/documentPptxLocal';

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

  const filePath = resolveLocalPptxPath(id);
  if (!filePath) {
    return res.status(404).end('Not found');
  }

  try {
    const buf = fs.readFileSync(filePath);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader('Content-Disposition', `inline; filename="${id}.pptx"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(buf);
  } catch {
    return res.status(500).end('Read failed');
  }
}
