import fs from 'fs';
import path from 'path';

/** PPTX: id → file trong repo (public/) */
export function resolveLocalPptxPath(id: string): string | null {
  const map: Record<string, string> = {
    demo: path.join(process.cwd(), 'public', 'samples', 'demo.pptx'),
    sample: path.join(process.cwd(), 'public', 'samples', 'demo.pptx'),
  };
  const p = map[id];
  if (!p || !fs.existsSync(p)) return null;
  return p;
}
