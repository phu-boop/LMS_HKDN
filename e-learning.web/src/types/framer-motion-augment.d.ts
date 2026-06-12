import 'framer-motion';

declare module 'framer-motion' {
  // Relax `m.*` element typings for legacy animation usage.
  // This keeps runtime behavior while avoiding React 19 type incompatibilities.
  export const m: Record<string, any>;
}
