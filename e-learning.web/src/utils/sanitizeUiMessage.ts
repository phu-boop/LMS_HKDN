/**
 * Ẩn origin/domain trong chuỗi hiển thị cho user (toast, alert).
 * Giữ lại path query nếu parse được URL; bỏ luôn base URL từ env nếu bị ghép vào message.
 */
export function sanitizeUiMessage(message: string): string {
  if (!message || typeof message !== 'string') return message;

  let out = message.trim();

  const envBase =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_HOST_API_URL?.trim() : undefined;
  if (envBase) {
    out = out.replace(new RegExp(envBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  }

  out = out.replace(/https?:\/\/[^\s"'<>]+/gi, (raw) => {
    try {
      const u = new URL(raw);
      const path = (u.pathname || '/') + u.search + u.hash;
      return path.length > 1 ? path : '';
    } catch {
      return '';
    }
  });

  out = out.replace(/\s{2,}/g, ' ').trim();
  return out;
}
