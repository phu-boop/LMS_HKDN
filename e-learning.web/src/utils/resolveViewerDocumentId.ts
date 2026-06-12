/**
 * Map route `[id]` → id an toàn cho API viewer.
 * Các alias UI (pdf, pptx, …) dùng bản demo.
 */
export function resolveViewerDocumentId(routeId: string | undefined): string {
  const raw = String(routeId || '').trim();
  const lower = raw.toLowerCase();
  if (!raw || lower === 'pdf' || lower === 'pptx' || lower === 'slide' || lower === 'slides') {
    return 'demo';
  }
  if (/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(raw) && raw.length <= 128) {
    return raw;
  }
  return 'demo';
}
