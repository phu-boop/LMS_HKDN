import type { NextApiRequest, NextApiResponse } from 'next';
import { assertDocumentViewerAuth, sanitizeDocumentViewerId } from '../../../../server/documentViewerAuth';

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

  try {
    const token = req.headers.authorization;
    const hostApi = process.env.NEXT_PUBLIC_HOST_API_URL || 'http://localhost:8080';
    const backendUrl = `${hostApi.replace(/\/$/, '')}/api/client/contents/${id}/view-url`;
    const viewRes = await fetch(backendUrl, {
      headers: token ? { Authorization: token } : {},
    });
    if (viewRes.ok) {
      const data = await viewRes.json();
      // Only return metadata, strip direct URLs to prevent downloading
      return res.status(200).json({
        id: data?.id,
        title: data?.title,
        description: data?.description,
        type: data?.type,
        fileSizeBytes: data?.fileSizeBytes,
        hasUrl: !!(data?.url || data?.viewUrl)
      });
    } else {
      return res.status(viewRes.status).json({ message: 'Failed to fetch metadata' });
    }
  } catch (err) {
    console.error('Failed to fetch metadata:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
