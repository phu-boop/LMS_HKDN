import type { NextApiRequest, NextApiResponse } from 'next';
import jwtDecode from 'jwt-decode';

/**
 * Bật tắt qua env (next.config hoặc shell). Mặc định nên false trên production thật.
 * Khi 'true', không bắt Authorization (phù hợp dev bypass login).
 */
export function isDocumentViewerAuthBypassed(): boolean {
  return process.env.DOCUMENT_VIEWER_AUTH_BYPASS === 'true';
}

function isBearerTokenValid(token: string): boolean {
  if (!token) return false;
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

/**
 * @returns true nếu được phép tiếp tục xử lý request
 */
export function assertDocumentViewerAuth(req: NextApiRequest, res: NextApiResponse): boolean {
  if (isDocumentViewerAuthBypassed()) {
    return true;
  }

  const raw = req.headers.authorization;
  const token = typeof raw === 'string' && raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';

  if (!isBearerTokenValid(token)) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Bearer');
    res.end('Unauthorized');
    return false;
  }

  return true;
}

export function sanitizeDocumentViewerId(raw: string | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const id = raw.trim().slice(0, 128);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(id)) return null;
  return id;
}
